import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { createDbClient } from '@/infrastructure/db/client';
import {
  TEAM_WEBHOOK_LEGACY_SECRET_PLACEHOLDER,
  buildTeamWebhookAudience
} from '@/domain/team-webhooks';
import { createPgRouteFixture, type PgTestDatabase } from '../../../../test-support/pg-route-fixture';
import {
  createTeamWebhookDeleteHandler,
  createTeamWebhookPatchHandler,
  createTeamWebhookRotatePostHandler,
  createTeamWebhooksGetHandler,
  createTeamWebhooksPreparePostHandler,
  createTeamWebhooksPostHandler
} from './handlers';

async function insertTeamWebhookSeedData(db: PgTestDatabase) {
  const nowIso = new Date().toISOString();
  await db
    .prepare(
      'INSERT INTO users (id, email, name, image, calendar_selection_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run('user-1', 'owner@example.com', 'Owner', null, '{}', nowIso, nowIso);
  await db
    .prepare(
      'INSERT INTO users (id, email, name, image, calendar_selection_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run('user-2', 'member@example.com', 'Member', null, '{}', nowIso, nowIso);
  await db
    .prepare(
      'INSERT INTO teams (id, name, share_id, owner_id, privacy, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run('team-1', 'Core Team', 'share-1', 'user-1', 'public', nowIso, nowIso);
  await db
    .prepare(
      'INSERT INTO team_members (id, team_id, user_id, member_public_id, calendar_selection, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run('member-1', 'team-1', 'user-1', 'memberpubid01', null, nowIso, nowIso);
  await db
    .prepare(
      'INSERT INTO team_members (id, team_id, user_id, member_public_id, calendar_selection, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run('member-2', 'team-1', 'user-2', 'memberpubid02', null, nowIso, nowIso);
  await db
    .prepare(
      'INSERT INTO team_webhook_subscriptions (id, team_id_raw, event_type, target_url, status, created_by_user_id_raw, updated_by_user_id_raw, created_at, updated_at, last_delivery_status, last_delivery_at, last_error, jwt_secret_encrypted, jwt_audience, secret_last_rotated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(
      'webhook-1',
      'team-1',
      'booking.requested',
      'https://hooks.example.com/one',
      'active',
      'user-1',
      'user-1',
      nowIso,
      nowIso,
      'never',
      null,
      null,
      'enc:secret-1',
      buildTeamWebhookAudience('webhook-1'),
      nowIso
    );
  await db
    .prepare(
      'INSERT INTO team_webhook_subscriptions (id, team_id_raw, event_type, target_url, status, created_by_user_id_raw, updated_by_user_id_raw, created_at, updated_at, last_delivery_status, last_delivery_at, last_error, jwt_secret_encrypted, jwt_audience, secret_last_rotated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(
      'webhook-2',
      'team-1',
      'booking.requested',
      'https://hooks.example.com/two',
      'disabled',
      'user-1',
      'user-1',
      nowIso,
      nowIso,
      'failed',
      nowIso,
      'HTTP 500',
      TEAM_WEBHOOK_LEGACY_SECRET_PLACEHOLDER,
      buildTeamWebhookAudience('webhook-2'),
      null
    );
}

function createTeamWebhookRouteDeps(overrides: Record<string, unknown> = {}) {
  return {
    auth: async () =>
      ({
        user: {
          id: 'user-1',
          email: 'owner@example.com'
        }
      }) as any,
    createDbClient,
    getConfig: () =>
      ({
        NODE_ENV: 'test'
      }) as any,
    isSameOriginRequest: () => true,
    getTokenVault: () =>
      ({
        encrypt: (value: string) => `enc:${value}`,
        decrypt: (value: string | null | undefined) =>
          String(value || '').startsWith('enc:') ? String(value).slice(4) : null
      }) as any,
    ...overrides
  };
}

test('GET /api/teams/:shareId/integrations/webhooks returns owner webhook list', async () => {
  const fixture = await createPgRouteFixture('teamcal-webhooks-route');
  await insertTeamWebhookSeedData(fixture.db);

  try {
    const handler = createTeamWebhooksGetHandler(createTeamWebhookRouteDeps());
    const request = new NextRequest('http://localhost/api/teams/share-1/integrations/webhooks', {
      method: 'GET',
      headers: { origin: 'http://localhost:3000' }
    });
    const response = await handler(request, {
      params: Promise.resolve({ shareId: 'share-1' })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload.webhooks, [
      {
        id: 'webhook-1',
        eventType: 'booking.requested',
        targetUrl: 'https://hooks.example.com/one',
        audience: 'team-webhook:webhook-1',
        status: 'active',
        isActive: true,
        secretStatus: 'configured',
        requiresProvisioning: false,
        secretLastRotatedAt: payload.webhooks[0].secretLastRotatedAt,
        lastDeliveryStatus: 'never',
        lastDeliveryAt: null,
        lastError: null
      },
      {
        id: 'webhook-2',
        eventType: 'booking.requested',
        targetUrl: 'https://hooks.example.com/two',
        audience: 'team-webhook:webhook-2',
        status: 'disabled',
        isActive: false,
        secretStatus: 'cutover_required',
        requiresProvisioning: true,
        secretLastRotatedAt: null,
        lastDeliveryStatus: 'failed',
        lastDeliveryAt: payload.webhooks[1].lastDeliveryAt,
        lastError: 'HTTP 500'
      }
    ]);
  } finally {
    await fixture.cleanup();
  }
});

test('GET /api/teams/:shareId/integrations/webhooks denies non-owner', async () => {
  const fixture = await createPgRouteFixture('teamcal-webhooks-route');
  await insertTeamWebhookSeedData(fixture.db);

  try {
    const handler = createTeamWebhooksGetHandler(
      createTeamWebhookRouteDeps({
        auth: async () =>
          ({
            user: {
              id: 'user-2',
              email: 'member@example.com'
            }
          }) as any
      })
    );
    const request = new NextRequest('http://localhost/api/teams/share-1/integrations/webhooks', {
      method: 'GET',
      headers: { origin: 'http://localhost:3000' }
    });
    const response = await handler(request, {
      params: Promise.resolve({ shareId: 'share-1' })
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.error, 'Only owner can manage team webhooks.');
  } finally {
    await fixture.cleanup();
  }
});

test('POST /api/teams/:shareId/integrations/webhooks/prepare returns one-time provisioning before save', async () => {
  const fixture = await createPgRouteFixture('teamcal-webhooks-route');
  await insertTeamWebhookSeedData(fixture.db);

  try {
    const handler = createTeamWebhooksPreparePostHandler(createTeamWebhookRouteDeps());
    const request = new NextRequest('http://localhost/api/teams/share-1/integrations/webhooks/prepare', {
      method: 'POST',
      headers: { origin: 'http://localhost:3000' }
    });
    const response = await handler(request, {
      params: Promise.resolve({ shareId: 'share-1' })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(typeof payload.provisioning.provisioningToken, 'string');
    assert.equal(payload.provisioning.secretVisibleOnce, true);
    assert.equal(typeof payload.provisioning.sharedSecret, 'string');
    assert.match(payload.provisioning.audience, /^team-webhook:/);

    const rows = await fixture.db
      .prepare('SELECT COUNT(*) as count FROM team_webhook_subscriptions WHERE team_id_raw = ?')
      .get<{ count: number }>('team-1');
    assert.ok(rows);
    assert.equal(Number(rows.count), 2);
  } finally {
    await fixture.cleanup();
  }
});

test('POST /api/teams/:shareId/integrations/webhooks creates webhook for owner from provisioning draft', async () => {
  const fixture = await createPgRouteFixture('teamcal-webhooks-route');
  await insertTeamWebhookSeedData(fixture.db);

  try {
    const prepareHandler = createTeamWebhooksPreparePostHandler(createTeamWebhookRouteDeps());
    const prepareRequest = new NextRequest('http://localhost/api/teams/share-1/integrations/webhooks/prepare', {
      method: 'POST',
      headers: { origin: 'http://localhost:3000' }
    });
    const prepareResponse = await prepareHandler(prepareRequest, {
      params: Promise.resolve({ shareId: 'share-1' })
    });
    const preparePayload = await prepareResponse.json();

    const handler = createTeamWebhooksPostHandler(createTeamWebhookRouteDeps());
    const request = new NextRequest('http://localhost/api/teams/share-1/integrations/webhooks', {
      method: 'POST',
      headers: { origin: 'http://localhost:3000', 'content-type': 'application/json' },
      body: JSON.stringify({
        targetUrl: 'https://hooks.example.com/three',
        provisioningToken: preparePayload.provisioning.provisioningToken
      })
    });
    const response = await handler(request, {
      params: Promise.resolve({ shareId: 'share-1' })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.webhook.targetUrl, 'https://hooks.example.com/three');
    assert.equal(payload.webhook.isActive, true);
    assert.equal(payload.webhook.secretStatus, 'configured');
    assert.equal(payload.webhook.requiresProvisioning, false);
    assert.equal(payload.provisioning, undefined);

    const rows = await fixture.db
      .prepare('SELECT COUNT(*) as count FROM team_webhook_subscriptions WHERE team_id_raw = ?')
      .get<{ count: number }>('team-1');
    assert.ok(rows);
    assert.equal(Number(rows.count), 3);

    const created = await fixture.db
      .prepare(
        'SELECT jwt_secret_encrypted, jwt_audience, secret_last_rotated_at FROM team_webhook_subscriptions WHERE target_url = ?'
      )
      .get<{ jwt_secret_encrypted: string; jwt_audience: string; secret_last_rotated_at: string | null }>(
        'https://hooks.example.com/three'
      );
    assert.ok(created);
    assert.match(created.jwt_secret_encrypted, /^enc:/);
    assert.match(created.jwt_audience, /^team-webhook:/);
    assert.equal(typeof created.secret_last_rotated_at, 'string');
  } finally {
    await fixture.cleanup();
  }
});

test('POST /api/teams/:shareId/integrations/webhooks rejects create without provisioning draft', async () => {
  const fixture = await createPgRouteFixture('teamcal-webhooks-route');
  await insertTeamWebhookSeedData(fixture.db);

  try {
    const handler = createTeamWebhooksPostHandler(createTeamWebhookRouteDeps());
    const request = new NextRequest('http://localhost/api/teams/share-1/integrations/webhooks', {
      method: 'POST',
      headers: { origin: 'http://localhost:3000', 'content-type': 'application/json' },
      body: JSON.stringify({ targetUrl: 'https://hooks.example.com/three' })
    });
    const response = await handler(request, {
      params: Promise.resolve({ shareId: 'share-1' })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.error, 'Prepare webhook secret before saving.');
  } finally {
    await fixture.cleanup();
  }
});

test('POST /api/teams/:shareId/integrations/webhooks rejects reused provisioning draft', async () => {
  const fixture = await createPgRouteFixture('teamcal-webhooks-route');
  await insertTeamWebhookSeedData(fixture.db);

  try {
    const prepareHandler = createTeamWebhooksPreparePostHandler(createTeamWebhookRouteDeps());
    const prepareRequest = new NextRequest('http://localhost/api/teams/share-1/integrations/webhooks/prepare', {
      method: 'POST',
      headers: { origin: 'http://localhost:3000' }
    });
    const prepareResponse = await prepareHandler(prepareRequest, {
      params: Promise.resolve({ shareId: 'share-1' })
    });
    const preparePayload = await prepareResponse.json();

    const handler = createTeamWebhooksPostHandler(createTeamWebhookRouteDeps());
    const token = preparePayload.provisioning.provisioningToken;
    const firstRequest = new NextRequest('http://localhost/api/teams/share-1/integrations/webhooks', {
      method: 'POST',
      headers: { origin: 'http://localhost:3000', 'content-type': 'application/json' },
      body: JSON.stringify({ targetUrl: 'https://hooks.example.com/three', provisioningToken: token })
    });
    const firstResponse = await handler(firstRequest, {
      params: Promise.resolve({ shareId: 'share-1' })
    });
    assert.equal(firstResponse.status, 201);

    const secondRequest = new NextRequest('http://localhost/api/teams/share-1/integrations/webhooks', {
      method: 'POST',
      headers: { origin: 'http://localhost:3000', 'content-type': 'application/json' },
      body: JSON.stringify({ targetUrl: 'https://hooks.example.com/four', provisioningToken: token })
    });
    const secondResponse = await handler(secondRequest, {
      params: Promise.resolve({ shareId: 'share-1' })
    });
    const secondPayload = await secondResponse.json();

    assert.equal(secondResponse.status, 400);
    assert.equal(secondPayload.error, 'Webhook provisioning already used. Generate a new secret.');
  } finally {
    await fixture.cleanup();
  }
});

test('POST /api/teams/:shareId/integrations/webhooks rejects duplicate target url', async () => {
  const fixture = await createPgRouteFixture('teamcal-webhooks-route');
  await insertTeamWebhookSeedData(fixture.db);

  try {
    const handler = createTeamWebhooksPostHandler(createTeamWebhookRouteDeps());
    const request = new NextRequest('http://localhost/api/teams/share-1/integrations/webhooks', {
      method: 'POST',
      headers: { origin: 'http://localhost:3000', 'content-type': 'application/json' },
      body: JSON.stringify({ targetUrl: 'https://hooks.example.com/one' })
    });
    const response = await handler(request, {
      params: Promise.resolve({ shareId: 'share-1' })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.error, 'Webhook already exists.');
  } finally {
    await fixture.cleanup();
  }
});

test('PATCH /api/teams/:shareId/integrations/webhooks/:webhookId toggles webhook state', async () => {
  const fixture = await createPgRouteFixture('teamcal-webhooks-route');
  await insertTeamWebhookSeedData(fixture.db);

  try {
    const handler = createTeamWebhookPatchHandler(createTeamWebhookRouteDeps());
    const request = new NextRequest('http://localhost/api/teams/share-1/integrations/webhooks/webhook-1', {
      method: 'PATCH',
      headers: { origin: 'http://localhost:3000', 'content-type': 'application/json' },
      body: JSON.stringify({ isActive: false })
    });
    const response = await handler(request, {
      params: Promise.resolve({ shareId: 'share-1', webhookId: 'webhook-1' })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.webhook.status, 'disabled');
    assert.equal(payload.webhook.isActive, false);
  } finally {
    await fixture.cleanup();
  }
});

test('POST /api/teams/:shareId/integrations/webhooks/:webhookId/rotate returns one-time provisioning data', async () => {
  const fixture = await createPgRouteFixture('teamcal-webhooks-route');
  await insertTeamWebhookSeedData(fixture.db);

  try {
    const handler = createTeamWebhookRotatePostHandler(createTeamWebhookRouteDeps());
    const request = new NextRequest(
      'http://localhost/api/teams/share-1/integrations/webhooks/webhook-2/rotate',
      {
        method: 'POST',
        headers: { origin: 'http://localhost:3000' }
      }
    );
    const response = await handler(request, {
      params: Promise.resolve({ shareId: 'share-1', webhookId: 'webhook-2' })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.webhook.id, 'webhook-2');
    assert.equal(payload.webhook.audience, 'team-webhook:webhook-2');
    assert.equal(payload.webhook.secretStatus, 'configured');
    assert.equal(payload.webhook.requiresProvisioning, false);
    assert.equal(payload.provisioning.audience, 'team-webhook:webhook-2');
    assert.equal(payload.provisioning.secretVisibleOnce, true);
    assert.equal(typeof payload.provisioning.sharedSecret, 'string');
    assert.ok(payload.provisioning.sharedSecret.length > 20);

    const row = await fixture.db
      .prepare(
        'SELECT jwt_secret_encrypted, jwt_audience, secret_last_rotated_at FROM team_webhook_subscriptions WHERE id = ?'
      )
      .get<{ jwt_secret_encrypted: string; jwt_audience: string; secret_last_rotated_at: string | null }>(
        'webhook-2'
      );
    assert.ok(row);
    assert.match(row.jwt_secret_encrypted, /^enc:/);
    assert.equal(row.jwt_audience, 'team-webhook:webhook-2');
    assert.equal(typeof row.secret_last_rotated_at, 'string');
  } finally {
    await fixture.cleanup();
  }
});

test('POST /api/teams/:shareId/integrations/webhooks/:webhookId/rotate denies non-owner', async () => {
  const fixture = await createPgRouteFixture('teamcal-webhooks-route');
  await insertTeamWebhookSeedData(fixture.db);

  try {
    const handler = createTeamWebhookRotatePostHandler(
      createTeamWebhookRouteDeps({
        auth: async () =>
          ({
            user: {
              id: 'user-2',
              email: 'member@example.com'
            }
          }) as any
      })
    );
    const request = new NextRequest(
      'http://localhost/api/teams/share-1/integrations/webhooks/webhook-2/rotate',
      {
        method: 'POST',
        headers: { origin: 'http://localhost:3000' }
      }
    );
    const response = await handler(request, {
      params: Promise.resolve({ shareId: 'share-1', webhookId: 'webhook-2' })
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.error, 'Only owner can manage team webhooks.');
  } finally {
    await fixture.cleanup();
  }
});

test('DELETE /api/teams/:shareId/integrations/webhooks/:webhookId removes webhook', async () => {
  const fixture = await createPgRouteFixture('teamcal-webhooks-route');
  await insertTeamWebhookSeedData(fixture.db);

  try {
    const handler = createTeamWebhookDeleteHandler(createTeamWebhookRouteDeps());
    const request = new NextRequest('http://localhost/api/teams/share-1/integrations/webhooks/webhook-1', {
      method: 'DELETE',
      headers: { origin: 'http://localhost:3000' }
    });
    const response = await handler(request, {
      params: Promise.resolve({ shareId: 'share-1', webhookId: 'webhook-1' })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, { deleted: true });

    const row = await fixture.db
      .prepare('SELECT id FROM team_webhook_subscriptions WHERE id = ?')
      .get('webhook-1');
    assert.equal(row, undefined);
  } finally {
    await fixture.cleanup();
  }
});
