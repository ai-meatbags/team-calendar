import { internalError, unauthorizedError } from '@/application/errors';
import {
  mergeCalendarSelection,
  parseCalendarSelectionStrict
} from '@/domain/calendar-selection/selection';
import { getCalendarList, type CurrentUserDeps } from './current-user-shared';
import { getCurrentUserById } from './get-current-user-by-id';

export async function getCurrentUserCalendarSettings(
  userId: string,
  deps: CurrentUserDeps,
  options: { sessionToken?: string | null } = {}
) {
  const user = await getCurrentUserById(userId, deps);
  if (!user) {
    throw unauthorizedError();
  }

  const calendarItems = await getCalendarList({
    createDbClient: deps.createDbClient,
    decryptRefreshToken: deps.decryptRefreshToken,
    fetchCalendarList: deps.fetchCalendarList,
    googleClientId: deps.googleClientId,
    googleClientSecret: deps.googleClientSecret,
    userId,
    sessionToken: options.sessionToken
  });

  const { selection, error } = parseCalendarSelectionStrict(user.calendarSelectionDefault);
  if (error) {
    throw internalError('Invalid calendar selection.', 'invalid_calendar_selection');
  }

  return {
    calendarSelectionDefault: mergeCalendarSelection(calendarItems, selection)
  };
}
