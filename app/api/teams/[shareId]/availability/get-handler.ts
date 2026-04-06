import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import type { AppEnv } from '@/composition/env';
import {
  MemberFilterValidationError,
  requireMemberPublicId,
  resolveAvailabilityMemberFilter
} from '@/domain/validation/member-filter';
import { createAppError, isAppError } from '@/application/errors';
import { listActiveCalendarIdsOrPrimary } from '@/domain/calendar-selection/selection';
import { computeAvailabilitySlotsByMembers } from '@/domain/availability/compute';
import type { createDbClient } from '@/infrastructure/db/client';
import { logger } from '@/infrastructure/logging/logger';
import type { enforceDbRateLimit } from '@/infrastructure/ratelimit/db-rate-limit';
import type { fetchBusyIntervals } from '@/infrastructure/google/freebusy';
import type { getClientFingerprint } from '@/interface/http/request';
import { toAvatarProxyUrl } from '@/interface/http/avatar-proxy';
import type { TokenVaultPort } from '@/ports/security';

const TIME_ZONE = 'Europe/Moscow';
const WORKDAY_START_HOUR = 10;
const WORKDAY_END_HOUR = 20;
const MIN_BOOKING_NOTICE_HOURS = 12;
const DAYS = 14;

export type AvailabilityRouteDeps = {
  createDbClient: typeof createDbClient;
  getConfig: () => Pick<
    AppEnv,
    'GOOGLE_CLIENT_ID' | 'GOOGLE_CLIENT_SECRET' | 'RATE_LIMIT_AVAILABILITY_MAX' | 'RATE_LIMIT_WINDOW_MIN'
  >;
  getTokenVault: () => TokenVaultPort;
  enforceDbRateLimit: typeof enforceDbRateLimit;
  fetchBusyIntervals: typeof fetchBusyIntervals;
  getClientFingerprint: typeof getClientFingerprint;
};

export function createAvailabilityGetHandler(deps: AvailabilityRouteDeps) {
  return async function GET(
    request: NextRequest,
    context: { params: Promise<{ shareId: string }> }
  ) {
    const config = deps.getConfig();
    const tokenVault = deps.getTokenVault();

    const rateLimitResult = await deps.enforceDbRateLimit({
      keyPrefix: 'availability',
      fingerprint: deps.getClientFingerprint(request),
      max: config.RATE_LIMIT_AVAILABILITY_MAX,
      windowMs: config.RATE_LIMIT_WINDOW_MIN * 60 * 1000
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many availability requests. Try again later.' },
        { status: 429 }
      );
    }

    const { shareId } = await context.params;
    const { searchParams } = new URL(request.url);
    const durationParam = Number.parseInt(searchParams.get('duration') || '30', 10);
    const slotMinutes = durationParam === 60 ? 60 : 30;

    const { db, schema } = deps.createDbClient();
    const teams = await (db as any)
      .select()
      .from((schema as any).teams)
      .where(eq((schema as any).teams.shareId, shareId))
      .limit(1);

    const team = teams[0];
    if (!team) {
      return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
    }

    const members = await (db as any)
      .select()
      .from((schema as any).teamMembers)
      .where(eq((schema as any).teamMembers.teamId, team.id));

    const entries = await Promise.all(
      members.map(async (member: any) => {
        const users = await (db as any)
          .select()
          .from((schema as any).users)
          .where(eq((schema as any).users.id, member.userId))
          .limit(1);

        if (!users[0]) return null;
        const memberPublicId = requireMemberPublicId(member.memberPublicId, { shareId });
        return {
          member,
          user: users[0],
          memberPublicId,
          name: users[0].name || 'Участник',
          picture: toAvatarProxyUrl(users[0].image || null)
        };
      })
    );

    const allMembers = entries.filter(Boolean) as Array<{
      member: any;
      user: any;
      memberPublicId: string;
      name: string;
      picture: string | null;
    }>;

    try {
      const memberFilter = searchParams.get('member');
      const selected = resolveAvailabilityMemberFilter({
        memberFilter,
        availableMemberPublicIds: allMembers.map((entry) => entry.memberPublicId)
      });

      const selectedMembers = selected.selectedMemberPublicId
        ? allMembers.filter((member) => member.memberPublicId === selected.selectedMemberPublicId)
        : allMembers;

      const now = new Date();
      const timeMin = new Date(now.getTime() + MIN_BOOKING_NOTICE_HOURS * 60 * 60 * 1000);
      const timeMax = new Date(now.getTime() + DAYS * 24 * 60 * 60 * 1000);

      const busyIntervalsByMember = await Promise.all(
        selectedMembers.map(async (entry) => {
          const accountRows = await (db as any)
            .select()
            .from((schema as any).accounts)
            .where(
              and(
                eq((schema as any).accounts.userId, entry.user.id),
                eq((schema as any).accounts.provider, 'google')
              )
            )
            .limit(1);

          const account = accountRows[0];
          const refreshToken = tokenVault.decrypt(account?.refreshToken || null);
          if (!refreshToken) {
            throw createAppError(
              409,
              'Calendar sync is not configured for one of the team members.',
              'missing_refresh_token'
            );
          }

          const selectionValue =
            entry.member.calendarSelection !== null && entry.member.calendarSelection !== undefined
              ? entry.member.calendarSelection
              : entry.user.calendarSelectionDefault;

          const calendarIds = listActiveCalendarIdsOrPrimary(selectionValue);

          return deps.fetchBusyIntervals({
            refreshToken,
            calendarIds,
            timeMin,
            timeMax,
            timeZone: TIME_ZONE,
            clientId: config.GOOGLE_CLIENT_ID,
            clientSecret: config.GOOGLE_CLIENT_SECRET
          });
        })
      );

      const slots = computeAvailabilitySlotsByMembers({
        members: selectedMembers.map((member) => ({
          memberPublicId: member.memberPublicId,
          name: member.name,
          picture: member.picture
        })),
        busyIntervalsByMember,
        timeMin,
        timeMax,
        slotMinutes: slotMinutes as 30 | 60,
        options: {
          timeZone: TIME_ZONE,
          workdayStartHour: WORKDAY_START_HOUR,
          workdayEndHour: WORKDAY_END_HOUR
        }
      });

      return NextResponse.json({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        timeZone: TIME_ZONE,
        slotMinutes,
        days: DAYS,
        workdayStartHour: WORKDAY_START_HOUR,
        workdayEndHour: WORKDAY_END_HOUR,
        minNoticeHours: MIN_BOOKING_NOTICE_HOURS,
        selectedMemberFilter: selected.selectedMemberPublicId,
        slots
      });
    } catch (error) {
      if (error instanceof MemberFilterValidationError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }

      logger.error('Failed to load availability', {
        shareId,
        slotMinutes,
        selectedMemberFilter: searchParams.get('member'),
        teamId: team.id,
        memberCount: allMembers.length,
        selectedMemberPublicIds:
          searchParams.get('member') && allMembers.some((item) => item.memberPublicId === searchParams.get('member'))
            ? [String(searchParams.get('member'))]
            : allMembers.map((item) => item.memberPublicId),
        error:
          error instanceof Error
            ? { name: error.name, message: error.message, stack: error.stack }
            : String(error)
      });

      if (isAppError(error)) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }

      return NextResponse.json({ error: 'Failed to load availability.' }, { status: 500 });
    }
  };
}
