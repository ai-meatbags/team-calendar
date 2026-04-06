import { enforceDbRateLimit } from '@/infrastructure/ratelimit/db-rate-limit';
import { getClientFingerprint, isSameOriginRequest } from '@/interface/http/request';
import { sendBookingNotifications } from '@/infrastructure/notifications/booking-delivery';
import { deliverTeamWebhookRequest } from '@/infrastructure/notifications/team-webhook-delivery';
import { logger } from '@/infrastructure/logging/logger';
import { auth } from '@/infrastructure/auth/auth-options';
import { getServerRuntime } from '@/composition/server-runtime';
import { sendTeamBookingWebhooks } from '@/application/usecases/team-webhooks';
import { createBookingPostHandler } from './post-handler';

export const runtime = 'nodejs';

export const POST = createBookingPostHandler({
  auth,
  createDbClient: () => getServerRuntime().dbClient,
  enforceDbRateLimit: (input) =>
    enforceDbRateLimit(input, {
      createDbClient: () => getServerRuntime().dbClient
    }),
  getClientFingerprint,
  getConfig: () => getServerRuntime().env,
  isSameOriginRequest,
  logger,
  sendBookingNotifications,
  sendBookingWebhook: ({ teamId, shareId, payload }) =>
    sendTeamBookingWebhooks(
      {
        createDbClient: () => getServerRuntime().dbClient,
        deliverWebhookRequest: deliverTeamWebhookRequest,
        logger,
        deliveryEnabled: getServerRuntime().env.BOOKING_WEBHOOK_DELIVERY_ENABLED,
        nodeEnv: getServerRuntime().env.NODE_ENV
      },
      {
        teamId,
        shareId,
        payload
      }
    )
});
