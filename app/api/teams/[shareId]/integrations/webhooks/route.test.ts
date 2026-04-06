import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { createDbClient } from '@/infrastructure/db/client';
import { createPgRouteFixture, type PgTestDatabase } from '../../../../test-support/pg-route-fixture';
import {
  createTeamWebhookDeleteHandler,
  createTeamWebhookPatchHandler,
  createTeamWebhooksGetHandler,
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
      'INSERT INTO team_webhook_subscriptions (id, team_id_raw, event_type, target_url, status, created_by_user_id_raw, updated_by_user_id_raw, created_at, updated_at, last_delivery_status, last_delivery_at, last_error) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
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
      null
    );
  await db
    .prepare(
      'INSERT INTO team_webhook_subscriptions (id, team_id_raw, event_type, target_url, status, created_by_user_id_raw, updated_by_user_id_raw, created_at, updated_at, last_delivery_status, last_delivery_at, last_error) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
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
      'HTTP 500'
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
        status: 'active',
        isActive: true,
        lastDeliveryStatus: 'never',
        lastDeliveryAt: null,
        lastError: null
      },
      {
        id: 'webhook-2',
        eventType: 'booking.requested',
        targetUrl: 'https://hooks.example.com/two',
        status: 'disabled',
        isActive: false,
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

test('POST /api/teams/:shareId/integrations/webhooks creates webhook for owner', async () => {
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

    assert.equal(response.status, 201);
    assert.equal(payload.webhook.targetUrl, 'https://hooks.example.com/three');
    assert.equal(payload.webhook.isActive, true);

    const rows = await fixture.db
      .prepare('SELECT COUNT(*) as count FROM team_webhook_subscriptions WHERE team_id_raw = ?')
      .get<{ count: number }>('team-1');
    assert.ok(rows);
    assert.equal(Number(rows.count), 3);
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
