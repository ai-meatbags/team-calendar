import { eq } from 'drizzle-orm';
import { badRequestError, unauthorizedError } from '@/application/errors';
import { getDbHandles, type CurrentUserDeps } from './current-user-shared';
import { getCurrentUserById } from './get-current-user-by-id';

export async function updateCurrentUserName(
  userId: string,
  name: string,
  deps: CurrentUserDeps
) {
  const normalizedName = String(name || '').trim();
  if (!normalizedName) {
    throw badRequestError('Missing user name.', 'missing_user_name');
  }

  const user = await getCurrentUserById(userId, deps);
  if (!user) {
    throw unauthorizedError();
  }

  const { db, schema } = getDbHandles(deps.createDbClient);
  await db
    .update(schema.users)
    .set({
      name: normalizedName,
      updatedAt: new Date().toISOString()
    })
    .where(eq(schema.users.id, userId));

  return {
    ...user,
    name: normalizedName
  };
}
