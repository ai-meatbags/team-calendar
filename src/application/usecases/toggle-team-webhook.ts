import { eq } from 'drizzle-orm';
import {
  assertOwner,
  findTeamByShareId,
  findWebhookByTeamAndId,
  getDbHandles,
  requireTeam,
  requireWebhook,
  toTeamWebhookListItem,
  type DbClientFactory
} from './team-webhooks-shared';

export async function toggleTeamWebhook(
  createDbClient: DbClientFactory,
  params: {
    shareId: string;
    userId: string;
    webhookId: string;
    isActive: boolean;
    nowIso: string;
  }
) {
  const team = requireTeam(await findTeamByShareId(createDbClient, params.shareId));
  assertOwner(team, params.userId);
  const row = requireWebhook(await findWebhookByTeamAndId(createDbClient, team.id, params.webhookId));

  const { db, schema } = getDbHandles(createDbClient);
  await db
    .update(schema.teamWebhookSubscriptions)
    .set({
      status: params.isActive ? 'active' : 'disabled',
      updatedByUserIdRaw: params.userId,
      updatedAt: params.nowIso
    })
    .where(eq(schema.teamWebhookSubscriptions.id, params.webhookId));

  return {
    webhook: toTeamWebhookListItem({
      ...row,
      status: params.isActive ? 'active' : 'disabled',
      updatedByUserIdRaw: params.userId,
      updatedAt: params.nowIso
    })
  };
}
