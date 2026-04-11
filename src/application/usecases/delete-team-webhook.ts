import { eq } from 'drizzle-orm';
import {
  assertOwner,
  findTeamByShareId,
  findWebhookByTeamAndId,
  getDbHandles,
  requireTeam,
  requireWebhook,
  type DbClientFactory
} from './team-webhooks-shared';

export async function deleteTeamWebhook(
  createDbClient: DbClientFactory,
  params: {
    shareId: string;
    userId: string;
    webhookId: string;
  }
) {
  const team = requireTeam(await findTeamByShareId(createDbClient, params.shareId));
  assertOwner(team, params.userId);
  requireWebhook(await findWebhookByTeamAndId(createDbClient, team.id, params.webhookId));

  const { db, schema } = getDbHandles(createDbClient);
  await db.delete(schema.teamWebhookSubscriptions).where(eq(schema.teamWebhookSubscriptions.id, params.webhookId));
  return { deleted: true };
}
