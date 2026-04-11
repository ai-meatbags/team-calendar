import { badRequestError } from '@/application/errors';
import { normalizeTeamPrivacy } from '@/domain/privacy/team-privacy';
import { getDbHandles, type DbClientFactory } from './team-page-shared';

export async function createTeam(
  createDbClient: DbClientFactory,
  params: {
    userId: string;
    name: string;
    generateId: () => string;
    generateShareId: () => string;
    generateMemberPublicId: () => string;
  }
) {
  const name = String(params.name || '').trim();
  if (!name) {
    throw badRequestError('Missing team name.', 'missing_team_name');
  }

  const { db, schema } = getDbHandles(createDbClient);
  const nowIso = new Date().toISOString();
  const teamId = params.generateId();
  const shareId = params.generateShareId();

  await db.insert(schema.teams).values({
    id: teamId,
    name,
    shareId,
    ownerId: params.userId,
    privacy: normalizeTeamPrivacy('public'),
    createdAt: nowIso,
    updatedAt: nowIso
  });

  await db.insert(schema.teamMembers).values({
    id: params.generateId(),
    teamId,
    userId: params.userId,
    memberPublicId: params.generateMemberPublicId(),
    calendarSelection: null,
    createdAt: nowIso,
    updatedAt: nowIso
  });

  return {
    name,
    shareId
  };
}
