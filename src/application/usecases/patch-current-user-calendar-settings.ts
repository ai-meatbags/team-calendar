import { eq } from 'drizzle-orm';
import { badRequestError, internalError, unauthorizedError } from '@/application/errors';
import {
  applyCalendarSelectionPatch,
  parseCalendarSelectionStrict
} from '@/domain/calendar-selection/selection';
import { getCalendarList, getDbHandles, type CurrentUserDeps } from './current-user-shared';
import { getCurrentUserById } from './get-current-user-by-id';

export async function patchCurrentUserCalendarSettings(
  userId: string,
  patchSelection: unknown,
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

  const patchedSelection = applyCalendarSelectionPatch(calendarItems, selection, patchSelection);
  if (patchedSelection.error) {
    if (patchedSelection.error.status === 400) {
      throw badRequestError('Invalid calendar selection payload.', 'invalid_calendar_selection_payload');
    }
    throw internalError('Invalid calendar selection.', 'invalid_calendar_selection');
  }

  const { db, schema } = getDbHandles(deps.createDbClient);
  await db
    .update(schema.users)
    .set({
      calendarSelectionDefault: JSON.stringify(patchedSelection.selection),
      updatedAt: new Date().toISOString()
    })
    .where(eq(schema.users.id, userId));

  return {
    calendarSelectionDefault: patchedSelection.selection
  };
}
