import { and, asc, eq } from 'drizzle-orm';
import type { DbClientProvider } from '@/ports/db';
import {
  badRequestError,
  forbiddenError,
  notFoundError
} from '@/application/errors';
import {
  assertValidTeamWebhookTargetUrl,
  TEAM_WEBHOOK_PROVISIONING_DRAFT_TTL_SECONDS,
  buildTeamWebhookAudience,
  getTeamWebhookDeliveryStatus,
  getTeamWebhookEventType,
  getTeamWebhookSecretStatus,
  getTeamWebhookStatus,
  isTeamWebhookSecretProvisioned,
  normalizeTeamWebhookLastError
} from '@/domain/team-webhooks';

export type DbClientFactory = () => DbClientProvider;

export type LoggerLike = {
  info: (message: string, fields?: Record<string, unknown>) => void;
  warn: (message: string, fields?: Record<string, unknown>) => void;
  error: (message: string, fields?: Record<string, unknown>) => void;
};

export type DeliverWebhookRequest = (params: {
  targetUrl: string;
  payload: unknown;
  nodeEnv: string;
  headers?: Record<string, string>;
}) => Promise<{
  ok: boolean;
  statusCode?: number;
  errorMessage?: string;
}>;

export function getDbHandles(createDbClient: DbClientFactory) {
  const client = createDbClient();
  return {
    db: client.db as any,
    schema: client.schema as any
  };
}

export async function findTeamByShareId(createDbClient: DbClientFactory, shareId: string) {
  const { db, schema } = getDbHandles(createDbClient);
  const teams = await db.select().from(schema.teams).where(eq(schema.teams.shareId, shareId)).limit(1);
  return teams[0] || null;
}

export function assertOwner(team: { ownerId: string }, userId: string) {
  if (String(team.ownerId) !== String(userId)) {
    throw forbiddenError('Only owner can manage team webhooks.', 'team_webhooks_forbidden');
  }
}

export function toTeamWebhookListItem(row: any) {
  const status = getTeamWebhookStatus(row.status);
  const secretStatus = getTeamWebhookSecretStatus(row.jwtSecretEncrypted);
  return {
    id: String(row.id),
    eventType: getTeamWebhookEventType(row.eventType),
    targetUrl: String(row.targetUrl),
    audience: String(row.jwtAudience || ''),
    status,
    isActive: status === 'active',
    secretStatus,
    requiresProvisioning: !isTeamWebhookSecretProvisioned(row.jwtSecretEncrypted),
    secretLastRotatedAt: row.secretLastRotatedAt ? String(row.secretLastRotatedAt) : null,
    lastDeliveryStatus: getTeamWebhookDeliveryStatus(row.lastDeliveryStatus),
    lastDeliveryAt: row.lastDeliveryAt ? String(row.lastDeliveryAt) : null,
    lastError: row.lastError ? String(row.lastError) : null
  };
}

export function toTeamWebhookProvisioning(row: any, sharedSecret: string) {
  return {
    audience: String(row.jwtAudience || ''),
    sharedSecret,
    secretVisibleOnce: true
  };
}

export function toTeamWebhookProvisioningDraft(params: {
  provisioningToken: string;
  audience: string;
  sharedSecret: string;
}) {
  return {
    provisioningToken: params.provisioningToken,
    audience: params.audience,
    sharedSecret: params.sharedSecret,
    secretVisibleOnce: true
  };
}

export function toDeliveryErrorMessage(errorMessage: string | undefined, statusCode?: number) {
  const fallback = statusCode ? `HTTP ${statusCode}` : 'unknown error';
  return normalizeTeamWebhookLastError(errorMessage || fallback);
}

export function toProvisioningRequiredErrorMessage() {
  return 'Webhook secret requires rotate or re-create before delivery';
}

export function buildTeamWebhookDeliveryPayload(params: {
  payload: unknown;
  eventType: string;
  eventId: string;
  deliveryId: string;
  occurredAt: string;
}) {
  if (params.payload && typeof params.payload === 'object' && !Array.isArray(params.payload)) {
    return {
      ...params.payload,
      eventId: params.eventId,
      deliveryId: params.deliveryId,
      occurredAt: params.occurredAt,
      type: params.eventType
    };
  }

  return {
    type: params.eventType,
    version: 1,
    eventId: params.eventId,
    deliveryId: params.deliveryId,
    occurredAt: params.occurredAt,
    data: params.payload
  };
}

export async function findWebhookByTeamAndId(
  createDbClient: DbClientFactory,
  teamId: string,
  webhookId: string
) {
  const { db, schema } = getDbHandles(createDbClient);
  const rows = await db
    .select()
    .from(schema.teamWebhookSubscriptions)
    .where(
      and(
        eq(schema.teamWebhookSubscriptions.teamIdRaw, teamId),
        eq(schema.teamWebhookSubscriptions.id, webhookId)
      )
    )
    .limit(1);
  return rows[0] || null;
}

export async function listWebhookRowsForTeam(
  createDbClient: DbClientFactory,
  teamId: string,
  eventType = 'booking.requested'
) {
  const { db, schema } = getDbHandles(createDbClient);
  return await db
    .select()
    .from(schema.teamWebhookSubscriptions)
    .where(
      and(
        eq(schema.teamWebhookSubscriptions.teamIdRaw, teamId),
        eq(schema.teamWebhookSubscriptions.eventType, eventType)
      )
    )
    .orderBy(asc(schema.teamWebhookSubscriptions.createdAt));
}

export async function updateWebhookDeliveryState(params: {
  createDbClient: DbClientFactory;
  webhookId: string;
  lastDeliveryStatus: 'success' | 'failed';
  lastDeliveryAt: string;
  lastError: string | null;
}) {
  const { db, schema } = getDbHandles(params.createDbClient);
  await db
    .update(schema.teamWebhookSubscriptions)
    .set({
      lastDeliveryStatus: params.lastDeliveryStatus,
      lastDeliveryAt: params.lastDeliveryAt,
      lastError: params.lastError
    })
    .where(eq(schema.teamWebhookSubscriptions.id, params.webhookId));
}

export function assertUniqueTeamWebhookTarget(duplicate: any) {
  if (duplicate?.[0]) {
    throw badRequestError('Webhook already exists.', 'team_webhook_duplicate');
  }
}

export function assertUnusedTeamWebhookProvisioning(existing: any) {
  if (existing?.[0]) {
    throw badRequestError(
      'Webhook provisioning already used. Generate a new secret.',
      'team_webhook_provisioning_used'
    );
  }
}

export function buildNewTeamWebhookRow(params: {
  webhookId: string;
  teamId: string;
  targetUrl: unknown;
  userId: string;
  sharedSecret: string;
  audience?: string;
  encryptSecret: (value: string) => string;
  nowIso: string;
  nodeEnv: string;
}) {
  const targetUrl = assertValidTeamWebhookTargetUrl(params.targetUrl, params.nodeEnv);

  return {
    row: {
      id: params.webhookId,
      teamIdRaw: params.teamId,
      eventType: 'booking.requested',
      targetUrl,
      status: 'active',
      createdByUserIdRaw: params.userId,
      updatedByUserIdRaw: params.userId,
      createdAt: params.nowIso,
      updatedAt: params.nowIso,
      lastDeliveryStatus: 'never',
      lastDeliveryAt: null,
      lastError: null,
      jwtSecretEncrypted: params.encryptSecret(params.sharedSecret),
      jwtAudience: String(params.audience || buildTeamWebhookAudience(params.webhookId)),
      secretLastRotatedAt: params.nowIso
    },
    targetUrl
  };
}

export function buildTeamWebhookProvisioningDraft(params: {
  webhookId: string;
  teamId: string;
  userId: string;
  sharedSecret: string;
  nowIso: string;
}) {
  const audience = buildTeamWebhookAudience(params.webhookId);
  const issuedAt = params.nowIso;
  const expiresAt = new Date(
    Date.parse(params.nowIso) + TEAM_WEBHOOK_PROVISIONING_DRAFT_TTL_SECONDS * 1000
  ).toISOString();

  return {
    audience,
    draft: {
      kind: 'team_webhook_provisioning',
      webhookId: params.webhookId,
      teamId: params.teamId,
      userId: params.userId,
      audience,
      sharedSecret: params.sharedSecret,
      issuedAt,
      expiresAt
    }
  };
}

export function decodeTeamWebhookProvisioningDraft(params: {
  provisioningToken: unknown;
  decryptDraft: (value: string | null | undefined) => string | null;
  teamId: string;
  userId: string;
  nowIso: string;
}) {
  const token = String(params.provisioningToken || '').trim();
  if (!token) {
    throw badRequestError('Prepare webhook secret before saving.', 'missing_webhook_provisioning');
  }

  const decrypted = params.decryptDraft(token);
  if (!decrypted) {
    throw badRequestError('Invalid webhook provisioning state.', 'invalid_webhook_provisioning');
  }

  let draft: Record<string, unknown>;
  try {
    draft = JSON.parse(decrypted) as Record<string, unknown>;
  } catch {
    throw badRequestError('Invalid webhook provisioning state.', 'invalid_webhook_provisioning');
  }

  if (draft.kind !== 'team_webhook_provisioning') {
    throw badRequestError('Invalid webhook provisioning state.', 'invalid_webhook_provisioning');
  }

  if (String(draft.teamId || '') !== params.teamId || String(draft.userId || '') !== params.userId) {
    throw badRequestError('Webhook provisioning does not match this team.', 'invalid_webhook_provisioning');
  }

  const expiresAt = String(draft.expiresAt || '').trim();
  if (!expiresAt || Number.isNaN(Date.parse(expiresAt)) || Date.parse(expiresAt) <= Date.parse(params.nowIso)) {
    throw badRequestError('Webhook provisioning expired. Generate a new secret.', 'expired_webhook_provisioning');
  }

  const webhookId = String(draft.webhookId || '').trim();
  const sharedSecret = String(draft.sharedSecret || '').trim();
  const audience = String(draft.audience || '').trim();
  if (!webhookId || !sharedSecret || !audience) {
    throw badRequestError('Invalid webhook provisioning state.', 'invalid_webhook_provisioning');
  }

  return {
    webhookId,
    sharedSecret,
    audience
  };
}

export function requireTeam(team: any) {
  if (!team) {
    throw notFoundError('Team not found.', 'team_not_found');
  }
  return team;
}

export function requireWebhook(row: any) {
  if (!row) {
    throw notFoundError('Webhook not found.', 'team_webhook_not_found');
  }
  return row;
}
