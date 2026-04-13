import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { createDbClient } from '@/infrastructure/db/client';
import { buildTeamWebhookAudience } from '@/domain/team-webhooks';
import { sendTeamBookingWebhooks } from '@/application/usecases/team-webhooks';
import { buildTeamWebhookHeaders, createTeamWebhookJwt } from '@/infrastructure/notifications/team-webhook-jwt';
import { createBookingPostHandler } from './post-handler';
import { createPgRouteFixture, type PgTestDatabase } from '../test-support/pg-route-fixture';

async function insertBookingSeedData(db: PgTestDatabase) {
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
    .run('user-2', 'OWNER@example.com', 'Owner Duplicate', null, '{}', nowIso, nowIso);
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
      'never',
      null,
      null,
      'enc:secret-2',
      buildTeamWebhookAudience('webhook-2'),
      nowIso
    );
  await db
    .prepare(
      'INSERT INTO team_webhook_subscriptions (id, team_id_raw, event_type, target_url, status, created_by_user_id_raw, updated_by_user_id_raw, created_at, updated_at, last_delivery_status, last_delivery_at, last_error, jwt_secret_encrypted, jwt_audience, secret_last_rotated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(
      'webhook-3',
      'team-1',
      'booking.requested',
      'https://hooks.example.com/fail',
      'active',
      'user-1',
      'user-1',
      nowIso,
      nowIso,
      'never',
      null,
      null,
      'enc:secret-3',
      buildTeamWebhookAudience('webhook-3'),
      nowIso
    );
}

function createRequestBody(overrides: Record<string, unknown> = {}) {
  return {
    shareId: 'share-1',
    slotStart: '2026-03-02T10:00:00.000Z',
    slotEnd: '2026-03-02T10:30:00.000Z',
    email: 'client@example.com',
    teamName: 'Core Team',
    comment: 'sync',
    selectionMode: 'all',
    selectedMemberPublicIds: ['memberpubid01', 'memberpubid02'],
    ...overrides
  };
}

test('POST /api/booking returns 429 when rate limit rejects request', async () => {
  const handler = createBookingPostHandler({
    auth: async () => null as any,
    createDbClient: (() => {
      throw new Error('createDbClient should not be called');
    }) as typeof createDbClient,
    enforceDbRateLimit: async () => ({ allowed: false, count: 1 }),
    getClientFingerprint: () => 'fp',
    getConfig: () => ({ RATE_LIMIT_BOOKING_MAX: 30, RATE_LIMIT_WINDOW_MIN: 15 } as any),
    isSameOriginRequest: () => true,
    logger: { warn: () => undefined } as any,
    sendBookingNotifications: async () => undefined,
    sendTeamBookingWebhooks: async () => undefined
  });

  const request = new NextRequest('http://localhost/api/booking', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(createRequestBody())
  });
  const response = await handler(request);
  const payload = await response.json();

  assert.equal(response.status, 429);
  assert.equal(payload.error, 'Too many booking requests. Try again later.');
});

test('POST /api/booking keeps success for best-effort side effects and deduplicates attendees', async () => {
  const fixture = await createPgRouteFixture('teamcal-booking-route');
  await insertBookingSeedData(fixture.db);
  const sentPayloads: any[] = [];

  try {
    const handler = createBookingPostHandler({
      auth: async () => null as any,
      createDbClient,
      enforceDbRateLimit: async () => ({ allowed: true, count: 1 }),
      getClientFingerprint: () => 'fp',
      getConfig: () =>
        ({
          APP_BASE_URL: 'http://localhost:3000',
          RATE_LIMIT_BOOKING_MAX: 30,
          RATE_LIMIT_WINDOW_MIN: 15
        }) as any,
      isSameOriginRequest: () => true,
      logger: { warn: () => undefined } as any,
      sendBookingNotifications: async () => {
        throw new Error('SMTP unavailable');
      },
      sendTeamBookingWebhooks: async ({ payload }) => {
        sentPayloads.push(payload);
        throw new Error('Webhook unavailable');
      }
    });

    const request = new NextRequest('http://localhost/api/booking', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(createRequestBody())
    });
    const response = await handler(request);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, { ok: true });
    assert.equal(sentPayloads.length, 1);
    assert.deepEqual(sentPayloads[0].selectedParticipantEmails, ['owner@example.com']);
    assert.deepEqual(sentPayloads[0].attendeeEmails, ['owner@example.com', 'client@example.com']);
    assert.equal(sentPayloads[0].teamLink, 'http://localhost/t/share-1');
    assert.equal(sentPayloads[0].slotDate, 'пн, 02 мар.');
    assert.equal(sentPayloads[0].slotStartMsk, '13:00');
    assert.equal(sentPayloads[0].slotEndMsk, '13:30');
    assert.equal(typeof sentPayloads[0].gcalLink, 'string');
    assert.match(sentPayloads[0].gcalLink, /^https:\/\/calendar\.google\.com\/calendar\/render\?/);
    assert.deepEqual(sentPayloads[0].teamMembersEmails, ['owner@example.com']);
    assert.equal(sentPayloads[0].requestedBy, null);
  } finally {
    await fixture.cleanup();
  }
});

test('POST /api/booking resolves single-member mode and uses session email for authenticated user', async () => {
  const fixture = await createPgRouteFixture('teamcal-booking-route');
  await insertBookingSeedData(fixture.db);
  const sentPayloads: any[] = [];

  try {
    const handler = createBookingPostHandler({
      auth: async () =>
        ({
          user: {
            id: 'auth-user',
            email: 'session@example.com'
          }
        }) as any,
      createDbClient,
      enforceDbRateLimit: async () => ({ allowed: true, count: 1 }),
      getClientFingerprint: () => 'fp',
      getConfig: () =>
        ({
          APP_BASE_URL: 'http://localhost:3000',
          RATE_LIMIT_BOOKING_MAX: 30,
          RATE_LIMIT_WINDOW_MIN: 15
        }) as any,
      isSameOriginRequest: () => true,
      logger: { warn: () => undefined } as any,
      sendBookingNotifications: async () => undefined,
      sendTeamBookingWebhooks: async ({ payload }) => {
        sentPayloads.push(payload);
      }
    });

    const request = new NextRequest('http://localhost/api/booking', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(
        createRequestBody({
          email: 'body@example.com',
          selectionMode: 'single',
          selectedMemberPublicIds: ['memberpubid01']
        })
      )
    });
    const response = await handler(request);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, { ok: true });
    assert.equal(sentPayloads.length, 1);
    assert.deepEqual(sentPayloads[0].selectedMemberPublicIds, ['memberpubid01']);
    assert.deepEqual(sentPayloads[0].selectedParticipantEmails, ['owner@example.com']);
    assert.equal(sentPayloads[0].email, 'session@example.com');
    assert.equal(sentPayloads[0].requestedBy, 'session@example.com');
  } finally {
    await fixture.cleanup();
  }
});

test('POST /api/booking fans out only to active team webhooks and stores delivery statuses', async () => {
  const fixture = await createPgRouteFixture('teamcal-booking-route');
  await insertBookingSeedData(fixture.db);
  const deliveredRequests: Array<{
    targetUrl: string;
    headers?: Record<string, string>;
    payload: any;
  }> = [];
  const issuedAt = new Date('2026-03-02T10:00:00.000Z');
  const generatedIds = ['event-1', 'delivery-1', 'delivery-2'];

  try {
    const handler = createBookingPostHandler({
      auth: async () => null as any,
      createDbClient,
      enforceDbRateLimit: async () => ({ allowed: true, count: 1 }),
      getClientFingerprint: () => 'fp',
      getConfig: () =>
        ({
          APP_BASE_URL: 'http://localhost:3000',
          RATE_LIMIT_BOOKING_MAX: 30,
          RATE_LIMIT_WINDOW_MIN: 15
        }) as any,
      isSameOriginRequest: () => true,
      logger: { info: () => undefined, warn: () => undefined, error: () => undefined } as any,
      sendBookingNotifications: async () => undefined,
      sendTeamBookingWebhooks: ({ teamId, shareId, payload }) =>
        sendTeamBookingWebhooks(
          {
            createDbClient,
            deliverWebhookRequest: async ({ targetUrl, headers, payload }) => {
              deliveredRequests.push({ targetUrl, headers, payload });
              if (targetUrl.endsWith('/fail')) {
                return {
                  ok: false,
                  statusCode: 500,
                  errorMessage: 'HTTP 500'
                };
              }
              return {
                ok: true,
                statusCode: 200
              };
            },
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
            decryptSecret: (value) => String(value || '').replace(/^enc:/, '') || null,
            generateId: () => generatedIds.shift() || 'fallback-id',
            logger: { info: () => undefined, warn: () => undefined, error: () => undefined },
            deliveryEnabled: true,
            nodeEnv: 'test',
            now: () => issuedAt
          },
          { teamId, shareId, payload }
        )
    });

    const request = new NextRequest('http://localhost/api/booking', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(createRequestBody())
    });
    const response = await handler(request);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, { ok: true });
    assert.deepEqual(
      [...deliveredRequests.map((request) => request.targetUrl)].sort(),
      ['https://hooks.example.com/fail', 'https://hooks.example.com/one']
    );
    assert.equal(deliveredRequests[0].headers?.['x-teamcal-event'], 'booking.requested');
    assert.equal(deliveredRequests[0].headers?.['x-teamcal-event-id'], 'event-1');
    assert.equal(deliveredRequests[0].headers?.['x-teamcal-delivery-id'], 'delivery-1');
    assert.equal(deliveredRequests[0].headers?.['x-teamcal-timestamp'], '1772445600');
    assert.match(String(deliveredRequests[0].headers?.authorization || ''), /^Bearer /);
    assert.equal(deliveredRequests[0].payload.eventId, 'event-1');
    assert.equal(deliveredRequests[0].payload.deliveryId, 'delivery-1');
    assert.equal(deliveredRequests[1].payload.eventId, 'event-1');
    assert.equal(deliveredRequests[1].payload.deliveryId, 'delivery-2');

    const rows = await fixture.db
      .prepare(
        'SELECT id, status, last_delivery_status, last_error FROM team_webhook_subscriptions ORDER BY id'
      )
      .all<{
        id: string;
        status: string;
        last_delivery_status: string;
        last_error: string | null;
      }>();

    assert.deepEqual(Array.from(rows), [
      {
        id: 'webhook-1',
        status: 'active',
        last_delivery_status: 'success',
        last_error: null
      },
      {
        id: 'webhook-2',
        status: 'disabled',
        last_delivery_status: 'never',
        last_error: null
      },
      {
        id: 'webhook-3',
        status: 'active',
        last_delivery_status: 'failed',
        last_error: 'HTTP 500'
      }
    ]);
  } finally {
    await fixture.cleanup();
  }
});

test('POST /api/booking skips team webhook delivery when kill switch is off', async () => {
  const fixture = await createPgRouteFixture('teamcal-booking-route');
  await insertBookingSeedData(fixture.db);
  let deliveryCalls = 0;

  try {
    const handler = createBookingPostHandler({
      auth: async () => null as any,
      createDbClient,
      enforceDbRateLimit: async () => ({ allowed: true, count: 1 }),
      getClientFingerprint: () => 'fp',
      getConfig: () =>
        ({
          APP_BASE_URL: 'http://localhost:3000',
          RATE_LIMIT_BOOKING_MAX: 30,
          RATE_LIMIT_WINDOW_MIN: 15
        }) as any,
      isSameOriginRequest: () => true,
      logger: { info: () => undefined, warn: () => undefined, error: () => undefined } as any,
      sendBookingNotifications: async () => undefined,
      sendTeamBookingWebhooks: ({ teamId, shareId, payload }) =>
        sendTeamBookingWebhooks(
          {
            createDbClient,
            deliverWebhookRequest: async () => {
              deliveryCalls += 1;
              return {
                ok: true,
                statusCode: 200
              };
            },
            createTeamWebhookHeaders: () => {
              throw new Error('headers should not be built when delivery is disabled');
            },
            decryptSecret: () => 'secret',
            generateId: () => 'unused-id',
            logger: { info: () => undefined, warn: () => undefined, error: () => undefined },
            deliveryEnabled: false,
            nodeEnv: 'test',
            now: () => new Date('2026-03-02T10:00:00.000Z')
          },
          { teamId, shareId, payload }
        )
    });

    const request = new NextRequest('http://localhost/api/booking', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(createRequestBody())
    });
    const response = await handler(request);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, { ok: true });
    assert.equal(deliveryCalls, 0);

    const rows = await fixture.db
      .prepare('SELECT last_delivery_status FROM team_webhook_subscriptions ORDER BY id')
      .all<{ last_delivery_status: string }>();
    assert.deepEqual(Array.from(rows), [
      { last_delivery_status: 'never' },
      { last_delivery_status: 'never' },
      { last_delivery_status: 'never' }
    ]);
  } finally {
    await fixture.cleanup();
  }
});

test('sendTeamBookingWebhooks marks legacy cutover subscriptions as failed without outbound call', async () => {
  const fixture = await createPgRouteFixture('teamcal-booking-route');
  await insertBookingSeedData(fixture.db);
  let deliveryCalls = 0;

  try {
    await fixture.db
      .prepare('UPDATE team_webhook_subscriptions SET jwt_secret_encrypted = ? WHERE id = ?')
      .run('__teamcal_jwt_secret_cutover_required__', 'webhook-1');

    await sendTeamBookingWebhooks(
      {
        createDbClient,
        deliverWebhookRequest: async () => {
          deliveryCalls += 1;
          return { ok: true, statusCode: 200 };
        },
        createTeamWebhookHeaders: () => ({ authorization: 'Bearer test' }),
        decryptSecret: (value) => (String(value || '').includes('cutover') ? null : 'secret'),
        generateId: () => 'id-fixed',
        logger: { info: () => undefined, warn: () => undefined, error: () => undefined },
        deliveryEnabled: true,
        nodeEnv: 'test',
        now: () => new Date('2026-03-02T10:00:00.000Z')
      },
      {
        teamId: 'team-1',
        shareId: 'share-1',
        payload: { type: 'booking.requested', version: 1 }
      }
    );

    assert.equal(deliveryCalls, 1);

    const rows = await fixture.db
      .prepare('SELECT id, last_delivery_status, last_error FROM team_webhook_subscriptions WHERE id IN (?, ?) ORDER BY id')
      .all<{ id: string; last_delivery_status: string; last_error: string | null }>('webhook-1', 'webhook-3');

    assert.deepEqual(Array.from(rows), [
      {
        id: 'webhook-1',
        last_delivery_status: 'failed',
        last_error: 'Webhook secret requires rotate or re-create before delivery'
      },
      {
        id: 'webhook-3',
        last_delivery_status: 'success',
        last_error: null
      }
    ]);
  } finally {
    await fixture.cleanup();
  }
});
