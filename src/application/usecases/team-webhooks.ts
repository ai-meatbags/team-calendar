import { and, asc, eq } from 'drizzle-orm';
import type { DbClientProvider } from '@/ports/db';
import {
  badRequestError,
  forbiddenError,
  notFoundError
} from '@/application/errors';
import {
  assertValidTeamWebhookTargetUrl,
  getTeamWebhookDeliveryStatus,
  getTeamWebhookEventType,
  getTeamWebhookStatus
} from '@/domain/team-webhooks';

type DbClientFactory = () => DbClientProvider;

type LoggerLike = {
  info: (message: string, fields?: Record<string, unknown>) => void;
  warn: (message: string, fields?: Record<string, unknown>) => void;
  error: (message: string, fields?: Record<string, unknown>) => void;
};

type DeliverWebhookRequest = (params: {
  targetUrl: string;
  payload: unknown;
  nodeEnv: string;
}) => Promise<{
  ok: boolean;
  statusCode?: number;
  errorMessage?: string;
}>;

function getDbHandles(createDbClient: DbClientFactory) {
  const client = createDbClient();
  return {
    db: client.db as any,
    schema: client.schema as any
  };
}

async function findTeamByShareId(createDbClient: DbClientFactory, shareId: string) {
  const { db, schema } = getDbHandles(createDbClient);
  const teams = await db.select().from(schema.teams).where(eq(schema.teams.shareId, shareId)).limit(1);
  return teams[0] || null;
}

function assertOwner(team: { ownerId: string }, userId: string) {
  if (String(team.ownerId) !== String(userId)) {
    throw forbiddenError('Only owner can manage team webhooks.', 'team_webhooks_forbidden');
  }
}

function toTeamWebhookListItem(row: any) {
  const status = getTeamWebhookStatus(row.status);
  return {
    id: String(row.id),
    eventType: getTeamWebhookEventType(row.eventType),
    targetUrl: String(row.targetUrl),
    status,
    isActive: status === 'active',
    lastDeliveryStatus: getTeamWebhookDeliveryStatus(row.lastDeliveryStatus),
    lastDeliveryAt: row.lastDeliveryAt ? String(row.lastDeliveryAt) : null,
    lastError: row.lastError ? String(row.lastError) : null
  };
}

function toDeliveryErrorMessage(errorMessage: string | undefined, statusCode?: number) {
  const fallback = statusCode ? `HTTP ${statusCode}` : 'unknown error';
  const value = String(errorMessage || fallback).trim();
  return value.slice(0, 400);
}

async function findWebhookByTeamAndId(createDbClient: DbClientFactory, teamId: string, webhookId: string) {
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

async function listWebhookRowsForTeam(
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

async function updateWebhookDeliveryState(params: {
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

export async function listTeamWebhooks(
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

  assertOwner(team, params.userId);
  const rows = await listWebhookRowsForTeam(createDbClient, team.id);
  return {
    webhooks: rows.map(toTeamWebhookListItem)
  };
}

export async function addTeamWebhook(
  createDbClient: DbClientFactory,
  params: {
    shareId: string;
    userId: string;
    targetUrl: unknown;
    generateId: () => string;
    nowIso: string;
    nodeEnv: string;
  }
) {
  const team = await findTeamByShareId(createDbClient, params.shareId);
  if (!team) {
    throw notFoundError('Team not found.', 'team_not_found');
  }

  assertOwner(team, params.userId);
  const targetUrl = assertValidTeamWebhookTargetUrl(params.targetUrl, params.nodeEnv);
  const { db, schema } = getDbHandles(createDbClient);
  const duplicate = await db
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

  if (duplicate[0]) {
    throw badRequestError('Webhook already exists.', 'team_webhook_duplicate');
  }

  const row = {
    id: params.generateId(),
    teamIdRaw: team.id,
    eventType: 'booking.requested',
    targetUrl,
    status: 'active',
    createdByUserIdRaw: params.userId,
    updatedByUserIdRaw: params.userId,
    createdAt: params.nowIso,
    updatedAt: params.nowIso,
    lastDeliveryStatus: 'never',
    lastDeliveryAt: null,
    lastError: null
  };

  await db.insert(schema.teamWebhookSubscriptions).values(row);
  return {
    webhook: toTeamWebhookListItem(row)
  };
}

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
  const team = await findTeamByShareId(createDbClient, params.shareId);
  if (!team) {
    throw notFoundError('Team not found.', 'team_not_found');
  }

  assertOwner(team, params.userId);
  const row = await findWebhookByTeamAndId(createDbClient, team.id, params.webhookId);
  if (!row) {
    throw notFoundError('Webhook not found.', 'team_webhook_not_found');
  }

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

export async function deleteTeamWebhook(
  createDbClient: DbClientFactory,
  params: {
    shareId: string;
    userId: string;
    webhookId: string;
  }
) {
  const team = await findTeamByShareId(createDbClient, params.shareId);
  if (!team) {
    throw notFoundError('Team not found.', 'team_not_found');
  }

  assertOwner(team, params.userId);
  const row = await findWebhookByTeamAndId(createDbClient, team.id, params.webhookId);
  if (!row) {
    throw notFoundError('Webhook not found.', 'team_webhook_not_found');
  }

  const { db, schema } = getDbHandles(createDbClient);
  await db.delete(schema.teamWebhookSubscriptions).where(eq(schema.teamWebhookSubscriptions.id, params.webhookId));
  return { deleted: true };
}

export async function sendTeamBookingWebhooks(
  deps: {
    createDbClient: DbClientFactory;
    deliverWebhookRequest: DeliverWebhookRequest;
    logger: LoggerLike;
    deliveryEnabled: boolean;
    nodeEnv: string;
  },
  params: {
    teamId: string;
    shareId: string;
    payload: unknown;
  }
) {
  if (!deps.deliveryEnabled) {
    deps.logger.info('Team webhook delivery skipped by config', {
      event: 'team_webhook_delivery_skipped',
      operation: 'booking.requested.webhook_fanout',
      outcome: 'success',
      shareId: params.shareId
    });
    return;
  }

  const rows = await listWebhookRowsForTeam(deps.createDbClient, params.teamId);
  const activeRows = rows.filter((row: any) => getTeamWebhookStatus(row.status) === 'active');
  if (!activeRows.length) {
    return;
  }

  await Promise.allSettled(
    activeRows.map(async (row: any) => {
      const lastDeliveryAt = new Date().toISOString();
      const result = await deps.deliverWebhookRequest({
        targetUrl: String(row.targetUrl),
        payload: params.payload,
        nodeEnv: deps.nodeEnv
      });

      if (result.ok) {
        await updateWebhookDeliveryState({
          createDbClient: deps.createDbClient,
          webhookId: String(row.id),
          lastDeliveryStatus: 'success',
          lastDeliveryAt,
          lastError: null
        });
        deps.logger.info('Team webhook delivered', {
          event: 'team_webhook_delivery',
          operation: 'booking.requested.webhook_fanout',
          outcome: 'success',
          shareId: params.shareId,
          webhookId: String(row.id),
          statusCode: result.statusCode || null
        });
        return;
      }

      const errorMessage = toDeliveryErrorMessage(result.errorMessage, result.statusCode);
      await updateWebhookDeliveryState({
        createDbClient: deps.createDbClient,
        webhookId: String(row.id),
        lastDeliveryStatus: 'failed',
        lastDeliveryAt,
        lastError: errorMessage
      });
      deps.logger.warn('Team webhook delivery failed', {
        event: 'team_webhook_delivery',
        operation: 'booking.requested.webhook_fanout',
        outcome: 'failed',
        error_type: 'dependency_error',
        shareId: params.shareId,
        webhookId: String(row.id),
        statusCode: result.statusCode || null,
        error: errorMessage
      });
    })
  );
}
