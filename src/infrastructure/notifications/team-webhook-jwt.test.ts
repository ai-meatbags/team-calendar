import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import { buildTeamWebhookHeaders, createTeamWebhookJwt } from './team-webhook-jwt';

test('createTeamWebhookJwt builds HS256 token with fixed claims', () => {
  const issuedAt = new Date('2026-03-02T10:00:00.000Z');
  const result = createTeamWebhookJwt({
    sharedSecret: 'secret-123',
    audience: 'team-webhook:webhook-1',
    teamId: 'team-1',
    deliveryId: 'delivery-1',
    eventType: 'booking.requested',
    issuedAt
  });

  const [encodedHeader, encodedPayload, signature] = result.token.split('.');
  const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8'));
  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  const expectedSignature = crypto
    .createHmac('sha256', 'secret-123')
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  assert.deepEqual(header, { alg: 'HS256', typ: 'JWT' });
  assert.deepEqual(payload, {
    iss: 'teamcal',
    aud: 'team-webhook:webhook-1',
    sub: 'team:team-1',
    jti: 'delivery-1',
    iat: 1772445600,
    exp: 1772445720,
    evt: 'booking.requested'
  });
  assert.equal(result.issuedAtSeconds, 1772445600);
  assert.equal(signature, expectedSignature);
});

test('buildTeamWebhookHeaders maps delivery metadata into X-Teamcal headers', () => {
  const headers = buildTeamWebhookHeaders({
    authorizationToken: 'jwt-token',
    eventType: 'booking.requested',
    eventId: 'event-1',
    deliveryId: 'delivery-1',
    issuedAtSeconds: 1740909600
  });

  assert.deepEqual(headers, {
    authorization: 'Bearer jwt-token',
    'content-type': 'application/json',
    'x-teamcal-event': 'booking.requested',
    'x-teamcal-event-id': 'event-1',
    'x-teamcal-delivery-id': 'delivery-1',
    'x-teamcal-timestamp': '1740909600'
  });
});
