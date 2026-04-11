import { and, eq } from 'drizzle-orm';
import {
  badRequestError,
  forbiddenError,
  internalError,
  notFoundError,
  unauthorizedError
} from '@/application/errors';
import {
  applyCalendarSelectionPatch,
  parseCalendarSelectionStrict,
  resolveSelectionSource
} from '@/domain/calendar-selection/selection';
import { isValidTeamPrivacy, normalizeTeamPrivacy } from '@/domain/privacy/team-privacy';
import {
  findMemberByTeamAndUser,
  findTeamByShareId,
  findUserById,
  getCalendarListForUser,
  getDbHandles,
  type TeamPageDeps
} from './team-page-shared';

export async function patchTeamSettings(
  deps: TeamPageDeps,
  params: {
    shareId: string;
    userId: string;
    body: unknown;
  }
) {
  const team = await findTeamByShareId(deps.createDbClient, params.shareId);
  if (!team) {
    throw notFoundError('Team not found.', 'team_not_found');
  }

  const member = await findMemberByTeamAndUser(deps.createDbClient, team.id, params.userId);
  if (!member) {
    throw forbiddenError('Not a team member.', 'not_team_member');
  }

  const user = await findUserById(deps.createDbClient, params.userId);
  if (!user) {
    throw unauthorizedError();
  }

  const body = params.body && typeof params.body === 'object' ? (params.body as Record<string, unknown>) : {};
  const hasName = Object.prototype.hasOwnProperty.call(body, 'name');
  const hasPrivacy = Object.prototype.hasOwnProperty.call(body, 'privacy');
  const hasCalendarSelection = Object.prototype.hasOwnProperty.call(body, 'calendarSelection');

  if (!hasName && !hasPrivacy && !hasCalendarSelection) {
    throw badRequestError('Nothing to update.', 'empty_patch');
  }

  const isOwner = String(team.ownerId) === String(params.userId);

  if (hasName && !isOwner) {
    throw forbiddenError('Only owner can edit team name.', 'team_name_forbidden');
  }
  if (hasPrivacy && !isOwner) {
    throw forbiddenError('Only owner can edit team privacy.', 'team_privacy_forbidden');
  }

  const { db, schema } = getDbHandles(deps.createDbClient);
  const nowIso = new Date().toISOString();

  if (hasName) {
    const name = String(body.name || '').trim();
    if (!name) {
      throw badRequestError('Missing team name.', 'missing_team_name');
    }

    await db
      .update(schema.teams)
      .set({
        name,
        updatedAt: nowIso
      })
      .where(eq(schema.teams.id, team.id));
  }

  if (hasPrivacy) {
    if (!isValidTeamPrivacy(body.privacy)) {
      throw badRequestError('Invalid privacy value.', 'invalid_team_privacy');
    }

    await db
      .update(schema.teams)
      .set({
        privacy: normalizeTeamPrivacy(body.privacy),
        updatedAt: nowIso
      })
      .where(eq(schema.teams.id, team.id));
  }

  if (hasCalendarSelection) {
    const { selectionValue } = resolveSelectionSource(
      member.calendarSelection,
      user.calendarSelectionDefault
    );
    const { selection: baseSelection, error } = parseCalendarSelectionStrict(selectionValue);
    if (error) {
      throw internalError('Invalid calendar selection.', 'invalid_calendar_selection');
    }

    const calendarItems = await getCalendarListForUser({
      createDbClient: deps.createDbClient,
      decryptRefreshToken: deps.decryptRefreshToken,
      fetchCalendarList: deps.fetchCalendarList,
      googleClientId: deps.googleClientId,
      googleClientSecret: deps.googleClientSecret,
      userId: user.id
    });

    const patched = applyCalendarSelectionPatch(
      calendarItems,
      baseSelection,
      body.calendarSelection
    );

    if (patched.error) {
      if (patched.error.status === 400) {
        throw badRequestError('Invalid calendar selection payload.', 'invalid_calendar_selection_payload');
      }
      throw internalError('Invalid calendar selection.', 'invalid_calendar_selection');
    }

    await db
      .update(schema.teamMembers)
      .set({
        calendarSelection: JSON.stringify(patched.selection),
        updatedAt: nowIso
      })
      .where(and(eq(schema.teamMembers.id, member.id)));

    return {
      calendarSelection: patched.selection
    };
  }

  return { updated: true };
}
