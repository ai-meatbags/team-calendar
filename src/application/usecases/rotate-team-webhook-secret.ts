import { eq } from 'drizzle-orm';
import {
  assertOwner,
  findTeamByShareId,
  findWebhookByTeamAndId,
  getDbHandles,
  requireTeam,
  requireWebhook,
  toTeamWebhookListItem,
  toTeamWebhookProvisioning,
  type DbClientFactory
} from './team-webhooks-shared';

export async function rotateTeamWebhookSecret(
  createDbClient: DbClientFactory,
  params: {
    shareId: string;
    userId: string;
    webhookId: string;
    generateSharedSecret: () => string;
    encryptSecret: (value: string) => string;
    nowIso: string;
  }
) {
  const team = requireTeam(await findTeamByShareId(createDbClient, params.shareId));
  assertOwner(team, params.userId);
  const row = requireWebhook(await findWebhookByTeamAndId(createDbClient, team.id, params.webhookId));

  const sharedSecret = params.generateSharedSecret();
  const encryptedSecret = params.encryptSecret(sharedSecret);
  const { db, schema } = getDbHandles(createDbClient);
  await db
    .update(schema.teamWebhookSubscriptions)
    .set({
      jwtSecretEncrypted: encryptedSecret,
      updatedByUserIdRaw: params.userId,
      updatedAt: params.nowIso,
      secretLastRotatedAt: params.nowIso
    })
    .where(eq(schema.teamWebhookSubscriptions.id, params.webhookId));

  const updatedRow = {
    ...row,
    jwtSecretEncrypted: encryptedSecret,
    updatedByUserIdRaw: params.userId,
    updatedAt: params.nowIso,
    secretLastRotatedAt: params.nowIso
  };

  return {
    webhook: toTeamWebhookListItem(updatedRow),
    provisioning: toTeamWebhookProvisioning(updatedRow, sharedSecret)
  };
}
