import { eq } from 'drizzle-orm';
import { getDbHandles, type CurrentUserDeps } from './current-user-shared';

export async function getCurrentUserById(userId: string, deps: CurrentUserDeps) {
  const { db, schema } = getDbHandles(deps.createDbClient);
  const users = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  return users[0] || null;
}
