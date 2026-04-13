import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import type { AppEnv } from '@/composition/env';
import {
  MemberFilterValidationError,
  resolveBookingTargetMemberPublicIds
} from '@/domain/validation/member-filter';
import { deduplicateEmails } from '@/domain/booking/notifications';
import type { createDbClient } from '@/infrastructure/db/client';
import type { enforceDbRateLimit } from '@/infrastructure/ratelimit/db-rate-limit';
import type { getClientFingerprint, isSameOriginRequest } from '@/interface/http/request';
import type { logger } from '@/infrastructure/logging/logger';
import type { sendBookingNotifications } from '@/infrastructure/notifications/booking-delivery';

export type BookingRouteDeps = {
  auth: () => Promise<any>;
  createDbClient: typeof createDbClient;
  enforceDbRateLimit: typeof enforceDbRateLimit;
  getClientFingerprint: typeof getClientFingerprint;
  getConfig: () => Pick<AppEnv, 'RATE_LIMIT_BOOKING_MAX' | 'RATE_LIMIT_WINDOW_MIN'>;
  isSameOriginRequest: typeof isSameOriginRequest;
  logger: typeof logger;
  sendBookingNotifications: typeof sendBookingNotifications;
  sendTeamBookingWebhooks: (params: { teamId: string; shareId: string; payload: unknown }) => Promise<void>;
};

const TIME_ZONE = 'Europe/Moscow';

function formatMsk(date: Date | null, options: Intl.DateTimeFormatOptions) {
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: TIME_ZONE,
    ...options
  }).format(date);
}

function toGcalDate(date: Date | null) {
  if (!date) {
    return null;
  }

  return date.toISOString().replace(/[-:]/g, '').replace('.000', '');
}

function resolveBaseUrl(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin) {
    return origin;
  }

  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost = request.headers.get('x-forwarded-host');
  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return request.nextUrl.origin;
}

function buildGcalLink(params: {
  attendeeEmails: string[];
  slotStart: Date;
  slotEnd: Date;
  teamName: string;
  comment: string;
  teamLink: string;
}) {
  const gcalStart = toGcalDate(params.slotStart);
  const gcalEnd = toGcalDate(params.slotEnd);
  if (!gcalStart || !gcalEnd) {
    return null;
  }

  const details = [
    params.comment,
    params.teamName ? `Команда: ${params.teamName}` : null,
    params.teamLink ? `Ссылка: ${params.teamLink}` : null
  ]
    .filter(Boolean)
    .join(' ');

  const title = `${params.teamName}: ${params.comment}`;
  const searchParams = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details,
    dates: `${gcalStart}/${gcalEnd}`,
    ctz: TIME_ZONE
  });

  params.attendeeEmails.forEach((email) => {
    searchParams.append('add', email);
  });

  return `https://calendar.google.com/calendar/render?${searchParams.toString()}`;
}

export function createBookingPostHandler(deps: BookingRouteDeps) {
  return async function POST(request: NextRequest) {
    if (!deps.isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
    }

    const config = deps.getConfig();
    const rateLimitResult = await deps.enforceDbRateLimit({
      keyPrefix: 'booking',
      fingerprint: deps.getClientFingerprint(request),
      max: config.RATE_LIMIT_BOOKING_MAX,
      windowMs: config.RATE_LIMIT_WINDOW_MIN * 60 * 1000
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many booking requests. Try again later.' }, { status: 429 });
    }

    const session = await deps.auth();
    const sessionEmail = String(session?.user?.email || '').trim().toLowerCase();

    const body = await request.json().catch(() => ({}));
    const shareId = String(body?.shareId || '').trim();
    if (!shareId) {
      return NextResponse.json({ error: 'Missing team shareId.' }, { status: 400 });
    }

    const slotStart = body?.slotStart ? new Date(body.slotStart) : null;
    const slotEnd = body?.slotEnd ? new Date(body.slotEnd) : null;
    if (!slotStart || !slotEnd || Number.isNaN(slotStart.getTime()) || Number.isNaN(slotEnd.getTime()) || slotEnd <= slotStart) {
      return NextResponse.json({ error: 'Invalid slot.' }, { status: 400 });
    }

    const hasSessionUser = Boolean((session?.user as any)?.id);
    const requesterEmail = String(hasSessionUser ? sessionEmail : body?.email || '')
      .trim()
      .toLowerCase();

    if (!requesterEmail) {
      return NextResponse.json(
        {
          error: hasSessionUser ? 'Missing authenticated requester email.' : 'Missing requester email.'
        },
        { status: 400 }
      );
    }

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

    const enriched = await Promise.all(
      members.map(async (member: any) => {
        const users = await (db as any)
          .select()
          .from((schema as any).users)
          .where(eq((schema as any).users.id, member.userId))
          .limit(1);
        if (!users[0]) return null;
        return {
          memberPublicId: member.memberPublicId,
          email: users[0].email
        };
      })
    );

    const candidates = enriched.filter(Boolean) as Array<{ memberPublicId: string; email: string }>;

    try {
      const resolved = resolveBookingTargetMemberPublicIds({
        selectionMode: body?.selectionMode,
        selectedMemberPublicIds: body?.selectedMemberPublicIds,
        availableMemberPublicIds: candidates.map((item) => item.memberPublicId)
      });

      const participantEmails = deduplicateEmails(
        candidates
          .filter((item) => resolved.targetMemberPublicIds.includes(item.memberPublicId))
          .map((item) => item.email)
      );

      if (!participantEmails.length) {
        return NextResponse.json({ error: 'Selected members are missing email.' }, { status: 400 });
      }

      const attendeeEmails = deduplicateEmails([...participantEmails, requesterEmail]);
      const teamName = String(body?.teamName || team.name || 'Встреча').trim();
      const comment = String(body?.comment || '').trim();
      const teamLink = `${resolveBaseUrl(request)}/t/${shareId}`;
      const slotDate = formatMsk(slotStart, {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
      });
      const slotStartMsk = formatMsk(slotStart, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const slotEndMsk = formatMsk(slotEnd, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const gcalLink = buildGcalLink({
        attendeeEmails,
        slotStart,
        slotEnd,
        teamName,
        comment,
        teamLink
      });

      const payload = {
        type: 'booking.requested',
        version: 1,
        shareId,
        teamName,
        slotStart: slotStart.toISOString(),
        slotEnd: slotEnd.toISOString(),
        slotDate,
        slotStartMsk,
        slotEndMsk,
        email: requesterEmail,
        comment: comment || null,
        requestedBy: hasSessionUser ? requesterEmail : null,
        selectionMode: resolved.selectionMode,
        selectedMemberPublicIds: resolved.targetMemberPublicIds,
        selectedParticipantEmails: participantEmails,
        teamMembersEmails: participantEmails,
        attendeeEmails,
        teamLink,
        gcalLink,
        gcalTeamLink: gcalLink,
        gcalRequesterLink: gcalLink
      };

      const sendRequesterConfirmation = !participantEmails.includes(requesterEmail);

      try {
        await deps.sendBookingNotifications({
          participantEmails,
          requesterEmail,
          sendRequesterConfirmation,
          teamName,
          teamLink,
          slotStartIso: slotStart.toISOString(),
          slotEndIso: slotEnd.toISOString(),
          comment
        });
      } catch (error) {
        deps.logger.warn('Booking notification delivery failed', {
          shareId,
          error: error instanceof Error ? error.message : String(error || 'unknown error')
        });
      }

      try {
        await deps.sendTeamBookingWebhooks({
          teamId: String(team.id),
          shareId,
          payload
        });
      } catch (error) {
        deps.logger.warn('Booking webhook delivery failed', {
          shareId,
          error: error instanceof Error ? error.message : String(error || 'unknown error')
        });
      }

      return NextResponse.json({ ok: true });
    } catch (error) {
      if (error instanceof MemberFilterValidationError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      return NextResponse.json({ error: 'Failed to send booking request.' }, { status: 500 });
    }
  };
}
