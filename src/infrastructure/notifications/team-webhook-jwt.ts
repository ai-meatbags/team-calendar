import crypto from 'node:crypto';
import {
  TEAM_WEBHOOK_JWT_ALGORITHM,
  TEAM_WEBHOOK_JWT_ISSUER,
  TEAM_WEBHOOK_JWT_TTL_SECONDS
} from '@/domain/team-webhooks';

type TeamWebhookJwtParams = {
  sharedSecret: string;
  audience: string;
  teamId: string;
  deliveryId: string;
  eventType: string;
  issuedAt: Date;
};

function encodeBase64Url(value: string | Buffer) {
  return Buffer.from(value).toString('base64url');
}

export function createTeamWebhookJwt(params: TeamWebhookJwtParams) {
  const issuedAtSeconds = Math.floor(params.issuedAt.getTime() / 1000);
  const header = {
    alg: TEAM_WEBHOOK_JWT_ALGORITHM,
    typ: 'JWT'
  };
  const payload = {
    iss: TEAM_WEBHOOK_JWT_ISSUER,
    aud: params.audience,
    sub: `team:${params.teamId}`,
    jti: params.deliveryId,
    iat: issuedAtSeconds,
    exp: issuedAtSeconds + TEAM_WEBHOOK_JWT_TTL_SECONDS,
    evt: params.eventType
  };

  const encodedHeader = encodeBase64Url(JSON.stringify(header));
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', params.sharedSecret)
    .update(signingInput)
    .digest('base64url');

  return {
    token: `${signingInput}.${signature}`,
    issuedAtSeconds
  };
}

export function buildTeamWebhookHeaders(params: {
  authorizationToken: string;
  eventType: string;
  eventId: string;
  deliveryId: string;
  issuedAtSeconds: number;
}) {
  return {
    authorization: `Bearer ${params.authorizationToken}`,
    'content-type': 'application/json',
    'x-teamcal-event': params.eventType,
    'x-teamcal-event-id': params.eventId,
    'x-teamcal-delivery-id': params.deliveryId,
    'x-teamcal-timestamp': String(params.issuedAtSeconds)
  };
}
