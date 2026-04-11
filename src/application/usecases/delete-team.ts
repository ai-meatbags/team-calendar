import { eq } from 'drizzle-orm';
import { forbiddenError, notFoundError } from '@/application/errors';
import { findTeamByShareId, getDbHandles, type DbClientFactory } from './team-page-shared';

export async function deleteTeam(
  createDbClient: DbClientFactory,
  params: {
    shareId: string;
    userId: string;
  }
) {
  const team = await findTeamByShareId(createDbClient, params.shareId);
  if (!team) {
    throw notFoundError('Team not found.', 'team_not_found');
  }

  if (String(team.ownerId) !== String(params.userId)) {
    throw forbiddenError('Only owner can delete team.', 'team_delete_forbidden');
  }

  const { db, schema } = getDbHandles(createDbClient);
  await db.delete(schema.teamMembers).where(eq(schema.teamMembers.teamId, team.id));
  await db.delete(schema.teams).where(eq(schema.teams.id, team.id));
  return { deleted: true };
}
