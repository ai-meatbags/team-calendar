import {
  assertOwner,
  findTeamByShareId,
  listWebhookRowsForTeam,
  requireTeam,
  toTeamWebhookListItem,
  type DbClientFactory
} from './team-webhooks-shared';

export async function listTeamWebhooks(
  createDbClient: DbClientFactory,
  params: {
    shareId: string;
    userId: string;
  }
) {
  const team = requireTeam(await findTeamByShareId(createDbClient, params.shareId));
  assertOwner(team, params.userId);
  const rows = await listWebhookRowsForTeam(createDbClient, team.id);
  return {
    webhooks: rows.map(toTeamWebhookListItem)
  };
}
