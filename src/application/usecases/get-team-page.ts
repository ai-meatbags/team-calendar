import { notFoundError } from '@/application/errors';
import { buildCanJoin, normalizeTeamPrivacy } from '@/domain/privacy/team-privacy';
import { findTeamByShareId, listTeamMembersWithUsers, type DbClientFactory } from './team-page-shared';

export async function getTeamPage(params: {
  createDbClient: DbClientFactory;
  shareId: string;
  userId?: string | null;
}) {
  const team = await findTeamByShareId(params.createDbClient, params.shareId);
  if (!team) {
    throw notFoundError('Team not found.', 'team_not_found');
  }

  const memberRows = await listTeamMembersWithUsers(params.createDbClient, team.id);
  const privacy = normalizeTeamPrivacy(team.privacy);
  const normalizedUserId = String(params.userId || '').trim();
  const isMember = Boolean(
    normalizedUserId &&
      memberRows.some((row: any) => String(row.member.userId) === normalizedUserId)
  );
  const isOwner = Boolean(normalizedUserId && String(team.ownerId) === normalizedUserId);

  return {
    team: {
      name: team.name,
      shareId: team.shareId,
      privacy
    },
    members: memberRows.map((row: any) => ({
      name: row.user.name || 'Участник',
      picture: row.user.image || null,
      memberPublicId: row.member.memberPublicId
    })),
    isMember,
    isOwner,
    canJoin: buildCanJoin({
      hasUser: Boolean(normalizedUserId),
      isMember,
      privacy
    })
  };
}
