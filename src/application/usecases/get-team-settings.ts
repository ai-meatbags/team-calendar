import { forbiddenError, internalError, notFoundError, unauthorizedError } from '@/application/errors';
import {
  mergeCalendarSelection,
  parseCalendarSelectionStrict,
  resolveSelectionSource
} from '@/domain/calendar-selection/selection';
import { normalizeTeamPrivacy } from '@/domain/privacy/team-privacy';
import {
  findMemberByTeamAndUser,
  findTeamByShareId,
  findUserById,
  getCalendarListForUser,
  type TeamPageDeps
} from './team-page-shared';

export async function getTeamSettings(
  deps: TeamPageDeps,
  params: {
    shareId: string;
    userId: string;
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

  const { selectionValue, source } = resolveSelectionSource(
    member.calendarSelection,
    user.calendarSelectionDefault
  );
  const calendarItems = await getCalendarListForUser({
    createDbClient: deps.createDbClient,
    decryptRefreshToken: deps.decryptRefreshToken,
    fetchCalendarList: deps.fetchCalendarList,
    googleClientId: deps.googleClientId,
    googleClientSecret: deps.googleClientSecret,
    userId: user.id
  });

  const { selection: baseSelection, error } = parseCalendarSelectionStrict(selectionValue);
  if (error) {
    throw internalError('Invalid calendar selection.', 'invalid_calendar_selection');
  }

  return {
    team: {
      id: team.id,
      name: team.name,
      shareId: team.shareId
    },
    canEditName: String(team.ownerId) === String(params.userId),
    canEditPrivacy: String(team.ownerId) === String(params.userId),
    canDelete: String(team.ownerId) === String(params.userId),
    privacy: normalizeTeamPrivacy(team.privacy),
    calendarSelection: mergeCalendarSelection(calendarItems, baseSelection),
    calendarSelectionSource: source
  };
}
