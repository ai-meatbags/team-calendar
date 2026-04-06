import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { createDbClient } from '@/infrastructure/db/client';
import { createAvailabilityGetHandler } from './[shareId]/availability/get-handler';
import { createPgRouteFixture, type PgTestDatabase } from '../test-support/pg-route-fixture';

async function insertAvailabilitySeedData(db: PgTestDatabase) {
  const nowIso = new Date().toISOString();
  await db
    .prepare(
      'INSERT INTO users (id, email, name, image, calendar_selection_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run('user-1', 'owner@example.com', 'Owner', null, '{"primary":{"active":true}}', nowIso, nowIso);
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
      'INSERT INTO accounts (user_id, type, provider, provider_account_id, refresh_token) VALUES (?, ?, ?, ?, ?)'
    )
    .run('user-1', 'oauth', 'google', 'google-user-1', 'enc-token');
}

function createRequest(url: string) {
  return new NextRequest(url, {
    method: 'GET',
    headers: {
      'x-forwarded-for': '127.0.0.1',
      'user-agent': 'route-test'
    }
  });
}

function createHandler(overrides: Record<string, unknown> = {}) {
  return createAvailabilityGetHandler({
    createDbClient,
    getTokenVault: () =>
      ({
        decrypt: () => 'refresh-token'
      }) as any,
    enforceDbRateLimit: async () => ({ allowed: true, count: 1 }),
    fetchBusyIntervals: async () => [],
    getClientFingerprint: () => 'fp',
    getConfig: () =>
      ({
        RATE_LIMIT_AVAILABILITY_MAX: 120,
        RATE_LIMIT_WINDOW_MIN: 15,
        GOOGLE_CLIENT_ID: 'test-client-id',
        GOOGLE_CLIENT_SECRET: 'test-client-secret'
      }) as any,
    ...overrides
  });
}

test('GET /api/teams/:shareId/availability returns 429 on limiter overflow', async () => {
  const handler = createHandler({
    enforceDbRateLimit: async () => ({ allowed: false, count: 1 })
  });
  const response = await handler(createRequest('http://localhost/api/teams/share-1/availability'), {
    params: Promise.resolve({ shareId: 'share-1' })
  });
  const payload = await response.json();

  assert.equal(response.status, 429);
  assert.equal(payload.error, 'Too many availability requests. Try again later.');
});

test('GET /api/teams/:shareId/availability validates member filter with 400', async () => {
  const fixture = await createPgRouteFixture('teamcal-availability-route');
  await insertAvailabilitySeedData(fixture.db);

  try {
    const handler = createHandler();
    const response = await handler(createRequest('http://localhost/api/teams/share-1/availability?member=bad'), {
      params: Promise.resolve({ shareId: 'share-1' })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.error, 'Invalid member filter.');
  } finally {
    await fixture.cleanup();
  }
});

test('GET /api/teams/:shareId/availability returns window invariants and duration=60 contract', async () => {
  const fixture = await createPgRouteFixture('teamcal-availability-route');
  await insertAvailabilitySeedData(fixture.db);

  try {
    const handler = createHandler();
    const beforeCall = Date.now();
    const response = await handler(createRequest('http://localhost/api/teams/share-1/availability?duration=60'), {
      params: Promise.resolve({ shareId: 'share-1' })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.slotMinutes, 60);
    assert.equal(payload.timeZone, 'Europe/Moscow');
    assert.equal(payload.days, 14);
    assert.equal(payload.minNoticeHours, 12);
    assert.equal(payload.workdayStartHour, 10);
    assert.equal(payload.workdayEndHour, 20);
    assert.equal(Array.isArray(payload.slots), true);

    const minLeadMs = Date.parse(payload.timeMin) - beforeCall;
    assert.ok(minLeadMs >= 11.5 * 60 * 60 * 1000);

    const rangeHours = (Date.parse(payload.timeMax) - Date.parse(payload.timeMin)) / (60 * 60 * 1000);
    assert.ok(rangeHours > 323.9 && rangeHours < 324.1);
  } finally {
    await fixture.cleanup();
  }
});

test('GET /api/teams/:shareId/availability falls back to 30 minutes for unsupported duration', async () => {
  const fixture = await createPgRouteFixture('teamcal-availability-route');
  await insertAvailabilitySeedData(fixture.db);

  try {
    const handler = createHandler();
    const response = await handler(createRequest('http://localhost/api/teams/share-1/availability?duration=45'), {
      params: Promise.resolve({ shareId: 'share-1' })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.slotMinutes, 30);
  } finally {
    await fixture.cleanup();
  }
});

test('GET /api/teams/:shareId/availability rewrites Google member pictures to avatar proxy', async () => {
  const fixture = await createPgRouteFixture('teamcal-availability-route');
  await insertAvailabilitySeedData(fixture.db);
  await fixture.db
    .prepare('UPDATE users SET image = ? WHERE id = ?')
    .run('https://lh3.googleusercontent.com/a/member-avatar=s96-c', 'user-1');

  try {
    const handler = createHandler();
    const response = await handler(createRequest('http://localhost/api/teams/share-1/availability?duration=30'), {
      params: Promise.resolve({ shareId: 'share-1' })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.ok(payload.slots.length > 0);
    assert.equal(
      payload.slots[0].members[0].picture,
      '/api/avatar?src=https%3A%2F%2Flh3.googleusercontent.com%2Fa%2Fmember-avatar%3Ds96-c'
    );
  } finally {
    await fixture.cleanup();
  }
});
