import crypto from 'node:crypto';
import { enforceDbRateLimit } from '@/infrastructure/ratelimit/db-rate-limit';
import { getClientFingerprint, isSameOriginRequest } from '@/interface/http/request';
import { sendBookingNotifications } from '@/infrastructure/notifications/booking-delivery';
import { deliverTeamWebhookRequest } from '@/infrastructure/notifications/team-webhook-delivery';
import { buildTeamWebhookHeaders, createTeamWebhookJwt } from '@/infrastructure/notifications/team-webhook-jwt';
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
        createTeamWebhookHeaders: ({ sharedSecret, audience, teamId, deliveryId, eventType, eventId, issuedAt }) => {
          const { token, issuedAtSeconds } = createTeamWebhookJwt({
            sharedSecret,
            audience,
            teamId,
            deliveryId,
            eventType,
            issuedAt
          });

          return buildTeamWebhookHeaders({
            authorizationToken: token,
            eventType,
            eventId,
            deliveryId,
            issuedAtSeconds
          });
        },
        decryptSecret: getServerRuntime().tokenVault.decrypt,
        generateId: crypto.randomUUID,
        logger,
        deliveryEnabled: getServerRuntime().env.BOOKING_WEBHOOK_DELIVERY_ENABLED,
        nodeEnv: getServerRuntime().env.NODE_ENV,
        now: getServerRuntime().now
      },
      {
        teamId,
        shareId,
        payload
      }
    )
});
