import {
  assertOwner,
  findTeamByShareId,
  requireTeam,
  toTeamWebhookProvisioningDraft,
  buildTeamWebhookProvisioningDraft,
  type DbClientFactory
} from './team-webhooks-shared';

export async function prepareTeamWebhookDraft(
  createDbClient: DbClientFactory,
  params: {
    shareId: string;
    userId: string;
    generateId: () => string;
    generateSharedSecret: () => string;
    encryptDraft: (value: string) => string;
    nowIso: string;
  }
) {
  const team = requireTeam(await findTeamByShareId(createDbClient, params.shareId));
  assertOwner(team, params.userId);

  const sharedSecret = params.generateSharedSecret();
  const webhookId = params.generateId();
  const { audience, draft } = buildTeamWebhookProvisioningDraft({
    webhookId,
    teamId: team.id,
    userId: params.userId,
    sharedSecret,
    nowIso: params.nowIso
  });

  return {
    provisioning: toTeamWebhookProvisioningDraft({
      provisioningToken: params.encryptDraft(JSON.stringify(draft)),
      audience,
      sharedSecret
    })
  };
}
