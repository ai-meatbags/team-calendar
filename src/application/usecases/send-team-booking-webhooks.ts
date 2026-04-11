import { getTeamWebhookStatus } from '@/domain/team-webhooks';
import {
  buildTeamWebhookDeliveryPayload,
  listWebhookRowsForTeam,
  toDeliveryErrorMessage,
  toProvisioningRequiredErrorMessage,
  updateWebhookDeliveryState,
  type DbClientFactory,
  type DeliverWebhookRequest,
  type LoggerLike
} from './team-webhooks-shared';

export async function sendTeamBookingWebhooks(
  deps: {
    createDbClient: DbClientFactory;
    deliverWebhookRequest: DeliverWebhookRequest;
    createTeamWebhookHeaders: (params: {
      sharedSecret: string;
      audience: string;
      teamId: string;
      deliveryId: string;
      eventType: string;
      eventId: string;
      issuedAt: Date;
    }) => Record<string, string>;
    decryptSecret: (value: string | null | undefined) => string | null;
    generateId: () => string;
    logger: LoggerLike;
    deliveryEnabled: boolean;
    nodeEnv: string;
    now: () => Date;
  },
  params: {
    teamId: string;
    shareId: string;
    payload: unknown;
  }
) {
  const eventType = 'booking.requested';
  if (!deps.deliveryEnabled) {
    deps.logger.info('Team webhook delivery skipped by config', {
      event: 'team_webhook_delivery_skipped',
      operation: 'booking.requested.webhook_fanout',
      outcome: 'success',
      shareId: params.shareId
    });
    return;
  }

  const rows = await listWebhookRowsForTeam(deps.createDbClient, params.teamId, eventType);
  const activeRows = rows.filter((row: any) => getTeamWebhookStatus(row.status) === 'active');
  if (!activeRows.length) {
    return;
  }

  const eventId = deps.generateId();
  await Promise.allSettled(
    activeRows.map(async (row: any) => {
      const issuedAt = deps.now();
      const lastDeliveryAt = issuedAt.toISOString();
      const deliveryId = deps.generateId();
      const sharedSecret = deps.decryptSecret(row.jwtSecretEncrypted);
      const audience = String(row.jwtAudience || '').trim();

      if (!sharedSecret || !audience) {
        const errorMessage = toProvisioningRequiredErrorMessage();
        await updateWebhookDeliveryState({
          createDbClient: deps.createDbClient,
          webhookId: String(row.id),
          lastDeliveryStatus: 'failed',
          lastDeliveryAt,
          lastError: errorMessage
        });
        deps.logger.warn('Team webhook delivery blocked by provisioning state', {
          event: 'team_webhook_delivery',
          operation: 'booking.requested.webhook_fanout',
          outcome: 'failed',
          error_type: 'config_error',
          shareId: params.shareId,
          webhookId: String(row.id),
          error: errorMessage
        });
        return;
      }

      const deliveryPayload = buildTeamWebhookDeliveryPayload({
        payload: params.payload,
        eventType,
        eventId,
        deliveryId,
        occurredAt: lastDeliveryAt
      });
      const result = await deps.deliverWebhookRequest({
        targetUrl: String(row.targetUrl),
        payload: deliveryPayload,
        nodeEnv: deps.nodeEnv,
        headers: deps.createTeamWebhookHeaders({
          sharedSecret,
          audience,
          teamId: params.teamId,
          deliveryId,
          eventType,
          eventId,
          issuedAt
        })
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
