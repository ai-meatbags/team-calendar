import { and, eq } from 'drizzle-orm';
import {
  assertOwner,
  assertUnusedTeamWebhookProvisioning,
  assertUniqueTeamWebhookTarget,
  buildNewTeamWebhookRow,
  decodeTeamWebhookProvisioningDraft,
  findTeamByShareId,
  getDbHandles,
  requireTeam,
  toTeamWebhookListItem,
  type DbClientFactory
} from './team-webhooks-shared';

export async function addTeamWebhook(
  createDbClient: DbClientFactory,
  params: {
    shareId: string;
    userId: string;
    targetUrl: unknown;
    provisioningToken: unknown;
    decryptDraft: (value: string | null | undefined) => string | null;
    encryptSecret: (value: string) => string;
    nowIso: string;
    nodeEnv: string;
  }
) {
  const team = requireTeam(await findTeamByShareId(createDbClient, params.shareId));
  assertOwner(team, params.userId);

  const { db, schema } = getDbHandles(createDbClient);
  const { webhookId, sharedSecret, audience } = decodeTeamWebhookProvisioningDraft({
    provisioningToken: params.provisioningToken,
    decryptDraft: params.decryptDraft,
    teamId: team.id,
    userId: params.userId,
    nowIso: params.nowIso
  });
  const { row, targetUrl } = buildNewTeamWebhookRow({
    webhookId,
    teamId: team.id,
    targetUrl: params.targetUrl,
    userId: params.userId,
    sharedSecret,
    audience,
    encryptSecret: params.encryptSecret,
    nowIso: params.nowIso,
    nodeEnv: params.nodeEnv
  });

  const duplicate = await db
    .select()
    .from(schema.teamWebhookSubscriptions)
    .where(eq(schema.teamWebhookSubscriptions.id, webhookId))
    .limit(1);

  assertUnusedTeamWebhookProvisioning(duplicate);

  const duplicateTarget = await db
    .select()
    .from(schema.teamWebhookSubscriptions)
    .where(
      and(
        eq(schema.teamWebhookSubscriptions.teamIdRaw, team.id),
        eq(schema.teamWebhookSubscriptions.eventType, 'booking.requested'),
        eq(schema.teamWebhookSubscriptions.targetUrl, targetUrl)
      )
    )
    .limit(1);

  assertUniqueTeamWebhookTarget(duplicateTarget);

  await db.insert(schema.teamWebhookSubscriptions).values(row);
  return {
    webhook: toTeamWebhookListItem(row)
  };
}
