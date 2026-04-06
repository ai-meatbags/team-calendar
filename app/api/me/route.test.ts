import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { createDbClient } from '@/infrastructure/db/client';
import { createPgRouteFixture, type PgTestDatabase } from '../test-support/pg-route-fixture';
import { createMeGetHandler, createMePatchHandler } from './get-handler';
import { createMeSettingsGetHandler } from './settings/get-handler';
import { createMeCalendarPatchHandler } from './calendar/patch-handler';

async function insertMeSeedData(db: PgTestDatabase) {
  const nowIso = new Date().toISOString();
  await db
    .prepare(
      'INSERT INTO users (id, email, name, image, calendar_selection_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(
      'user-1',
      'user@example.com',
      'Old Name',
      'https://example.com/avatar.png',
      '{"primary":{"active":true}}',
      nowIso,
      nowIso
    );
  await db
    .prepare(
      'INSERT INTO accounts (user_id, type, provider, provider_account_id, refresh_token) VALUES (?, ?, ?, ?, ?)'
    )
    .run('user-1', 'oauth', 'google', 'google-user-1', 'enc-refresh-token');
}

function createMeRouteDeps(overrides: Record<string, unknown> = {}) {
  return {
    auth: async () =>
      ({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          image: 'https://example.com/session.png'
        }
      }) as any,
    createDbClient,
    getTokenVault: () =>
      ({
        decrypt: (value: string | null | undefined) => value || null,
        encrypt: (value: string) => value,
        isEncrypted: () => true
      }) as any,
    fetchCalendarList: async () => [{ id: 'primary', summary: 'Primary' }],
    getConfig: () =>
      ({
        GOOGLE_CLIENT_ID: 'google-client-id',
        GOOGLE_CLIENT_SECRET: 'google-client-secret'
      }) as any,
    isSameOriginRequest: () => true,
    ...overrides
  };
}

test('PATCH /api/me validates user name and keeps row unchanged', async () => {
  const fixture = await createPgRouteFixture('teamcal-me-route');
  await insertMeSeedData(fixture.db);

  try {
    const handler = createMePatchHandler(createMeRouteDeps());
    const request = new NextRequest('http://localhost/api/me', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '   ' })
    });
    const response = await handler(request);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.error, 'Missing user name.');

    const row = await fixture.db.prepare('SELECT name FROM users WHERE id = ?').get<{
      name: string;
    }>('user-1');
    assert.ok(row);
    assert.equal(row.name, 'Old Name');
  } finally {
    await fixture.cleanup();
  }
});

test('PATCH /api/me updates current user name with public payload parity', async () => {
  const fixture = await createPgRouteFixture('teamcal-me-route');
  await insertMeSeedData(fixture.db);

  try {
    const handler = createMePatchHandler(createMeRouteDeps());
    const request = new NextRequest('http://localhost/api/me', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Ivan' })
    });
    const response = await handler(request);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.name, 'Ivan');
    assert.equal(payload.email, 'user@example.com');
    assert.equal(payload.picture, 'https://example.com/avatar.png');

    const row = await fixture.db.prepare('SELECT name FROM users WHERE id = ?').get<{
      name: string;
    }>('user-1');
    assert.ok(row);
    assert.equal(row.name, 'Ivan');
  } finally {
    await fixture.cleanup();
  }
});

test('GET /api/me/settings returns merged selection with titles', async () => {
  const fixture = await createPgRouteFixture('teamcal-me-route');
  await insertMeSeedData(fixture.db);

  try {
    const handler = createMeSettingsGetHandler(createMeRouteDeps());
    const request = new NextRequest('http://localhost/api/me/settings', {
      method: 'GET',
      headers: { origin: 'http://localhost:3000' }
    });
    const response = await handler(request);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload.calendarSelectionDefault.primary, {
      id: 'primary',
      title: 'Primary',
      active: true
    });
  } finally {
    await fixture.cleanup();
  }
});

test('GET /api/me/settings returns 400 when calendar credentials are missing', async () => {
  const fixture = await createPgRouteFixture('teamcal-me-route');
  await insertMeSeedData(fixture.db);
  await fixture.db.prepare('DELETE FROM accounts WHERE user_id = ?').run('user-1');

  try {
    const handler = createMeSettingsGetHandler(createMeRouteDeps());
    const request = new NextRequest('http://localhost/api/me/settings', {
      method: 'GET',
      headers: { origin: 'http://localhost:3000' }
    });
    const response = await handler(request);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.error, 'Missing calendar credentials.');
  } finally {
    await fixture.cleanup();
  }
});

test('PATCH /api/me/calendar maps calendar sync failure to 500', async () => {
  const fixture = await createPgRouteFixture('teamcal-me-route');
  await insertMeSeedData(fixture.db);

  try {
    const handler = createMeCalendarPatchHandler(
      createMeRouteDeps({
        fetchCalendarList: async () => {
          throw new Error('google down');
        }
      })
    );
    const request = new NextRequest('http://localhost/api/me/calendar', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
      body: JSON.stringify({ calendarSelection: { primary: { active: true } } })
    });
    const response = await handler(request);
    const payload = await response.json();

    assert.equal(response.status, 500);
    assert.equal(payload.error, 'Calendar sync failed.');
  } finally {
    await fixture.cleanup();
  }
});

test('PATCH /api/me/calendar returns patched merged selection and persists it', async () => {
  const fixture = await createPgRouteFixture('teamcal-me-route');
  await insertMeSeedData(fixture.db);

  try {
    const handler = createMeCalendarPatchHandler(
      createMeRouteDeps({
        fetchCalendarList: async () => [
          { id: 'primary', summary: 'Primary' },
          { id: 'work', summary: 'Work' }
        ]
      })
    );
    const request = new NextRequest('http://localhost/api/me/calendar', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
      body: JSON.stringify({ calendarSelection: { work: { active: true } } })
    });
    const response = await handler(request);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload.calendarSelectionDefault.work, {
      id: 'work',
      title: 'Work',
      active: true
    });
    assert.deepEqual(payload.calendarSelectionDefault.primary, {
      id: 'primary',
      title: 'Primary',
      active: true
    });

    const row = await fixture.db
      .prepare('SELECT calendar_selection_default FROM users WHERE id = ?')
      .get<{ calendar_selection_default: string }>('user-1');
    assert.ok(row);
    assert.match(row.calendar_selection_default, /"work"/);
  } finally {
    await fixture.cleanup();
  }
});

test('GET /api/me falls back to session picture when db image is empty', async () => {
  const fixture = await createPgRouteFixture('teamcal-me-route');
  await insertMeSeedData(fixture.db);
  await fixture.db.prepare('UPDATE users SET image = NULL WHERE id = ?').run('user-1');

  try {
    const handler = createMeGetHandler(createMeRouteDeps());
    const response = await handler();
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.picture, 'https://example.com/session.png');
  } finally {
    await fixture.cleanup();
  }
});

test('GET /api/me rewrites Google-hosted picture to same-origin avatar proxy', async () => {
  const fixture = await createPgRouteFixture('teamcal-me-route');
  await insertMeSeedData(fixture.db);
  await fixture.db
    .prepare('UPDATE users SET image = ? WHERE id = ?')
    .run('https://lh3.googleusercontent.com/a/avatar=s96-c', 'user-1');

  try {
    const handler = createMeGetHandler(createMeRouteDeps());
    const response = await handler();
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(
      payload.picture,
      '/api/avatar?src=https%3A%2F%2Flh3.googleusercontent.com%2Fa%2Favatar%3Ds96-c'
    );
  } finally {
    await fixture.cleanup();
  }
});

test('GET /api/me resolves user by session id even when session email differs', async () => {
  const fixture = await createPgRouteFixture('teamcal-me-route');
  await insertMeSeedData(fixture.db);

  try {
    const handler = createMeGetHandler(
      createMeRouteDeps({
        auth: async () =>
          ({
            user: {
              id: 'user-1',
              email: 'mismatch@example.com',
              image: 'https://example.com/session.png'
            }
          }) as any
      })
    );
    const response = await handler();
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.email, 'user@example.com');
    assert.equal(payload.name, 'Old Name');
  } finally {
    await fixture.cleanup();
  }
});
