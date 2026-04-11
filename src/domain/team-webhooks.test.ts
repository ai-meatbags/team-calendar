import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TEAM_WEBHOOK_JWT_ALGORITHM,
  TEAM_WEBHOOK_JWT_ISSUER,
  TEAM_WEBHOOK_JWT_TTL_SECONDS,
  TEAM_WEBHOOK_LEGACY_SECRET_PLACEHOLDER,
  buildTeamWebhookAudience,
  getTeamWebhookSecretStatus,
  isTeamWebhookSecretProvisioned,
  normalizeTeamWebhookLastError
} from './team-webhooks';

test('team webhook JWT contract exports fixed runtime constants', () => {
  assert.equal(TEAM_WEBHOOK_JWT_ISSUER, 'teamcal');
  assert.equal(TEAM_WEBHOOK_JWT_ALGORITHM, 'HS256');
  assert.equal(TEAM_WEBHOOK_JWT_TTL_SECONDS, 120);
});

test('buildTeamWebhookAudience derives stable audience from webhook id', () => {
  assert.equal(buildTeamWebhookAudience('webhook-123'), 'team-webhook:webhook-123');
});

test('isTeamWebhookSecretProvisioned rejects legacy cutover placeholder', () => {
  assert.equal(isTeamWebhookSecretProvisioned(TEAM_WEBHOOK_LEGACY_SECRET_PLACEHOLDER), false);
  assert.equal(isTeamWebhookSecretProvisioned('enc.secret.value'), true);
});

test('getTeamWebhookSecretStatus marks legacy placeholder as cutover_required', () => {
  assert.equal(getTeamWebhookSecretStatus(TEAM_WEBHOOK_LEGACY_SECRET_PLACEHOLDER), 'cutover_required');
  assert.equal(getTeamWebhookSecretStatus('enc.secret.value'), 'configured');
});

test('normalizeTeamWebhookLastError redacts sensitive fragments and truncates output', () => {
  const value = normalizeTeamWebhookLastError(
    'authorization: Bearer very-secret-token token=abc123 password=qwerty'
  );

  assert.equal(
    value,
    'authorization: bearer [redacted] token=[redacted] password=[redacted]'
  );
});
