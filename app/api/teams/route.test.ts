import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { createDbClient } from '@/infrastructure/db/client';
import { createPgRouteFixture, type PgTestDatabase } from '../test-support/pg-route-fixture';
import { createTeamsGetHandler, createTeamsPostHandler } from './teams-handler';
import { createTeamGetHandler } from './[shareId]/team-handler';

async function insertTeamsSeedData(db: PgTestDatabase) {
  const nowIso = new Date().toISOString();
  await db
    .prepare(
      'INSERT INTO users (id, email, name, image, calendar_selection_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run('user-1', 'owner@example.com', 'Owner', null, '{}', nowIso, nowIso);
  await db
    .prepare(
      'INSERT INTO user_slot_rule_settings (id, user_id, days, workday_start_hour, workday_end_hour, min_notice_hours, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run('slot-1', 'user-1', 14, 10, 20, 12, nowIso, nowIso);
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
}

function createTeamsRouteDeps(overrides: Record<string, unknown> = {}) {
  return {
    auth: async () =>
      ({
        user: {
          id: 'user-1',
          email: 'owner@example.com'
        }
      }) as any,
    createDbClient,
    generateId: () => 'generated-id',
    generateMemberPublicId: () => 'generated-member-public-id',
    generateShareId: () => 'generated-share-id',
    isSameOriginRequest: () => true,
    ...overrides
  };
}

function createShareTeamRouteDeps(overrides: Record<string, unknown> = {}) {
  return {
    auth: async () =>
      ({
        user: {
          id: 'user-1',
          email: 'owner@example.com'
        }
      }) as any,
    createDbClient,
    getTokenVault: () =>
      ({
        decrypt: (value: string | null | undefined) => value || null,
        encrypt: (value: string) => value,
        isEncrypted: () => true
      }) as any,
    fetchCalendarList: async () => [],
    getConfig: () =>
      ({
        GOOGLE_CLIENT_ID: 'google-client-id',
        GOOGLE_CLIENT_SECRET: 'google-client-secret'
      }) as any,
    isSameOriginRequest: () => true,
    ...overrides
  };
}

test('GET /api/teams returns user teams', async () => {
  const fixture = await createPgRouteFixture('teamcal-teams-route');
  await insertTeamsSeedData(fixture.db);

  try {
    const handler = createTeamsGetHandler(createTeamsRouteDeps());
    const response = await handler();
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload.teams, [
      {
        name: 'Core Team',
        shareId: 'share-1',
        members: [{ name: 'Owner', picture: null }],
        myAvailability: {
          workdayStartHour: 10,
          workdayEndHour: 20
        }
      }
    ]);
  } finally {
    await fixture.cleanup();
  }
});

test('POST /api/teams validates name and creates team+membership', async () => {
  const fixture = await createPgRouteFixture('teamcal-teams-route');
  await insertTeamsSeedData(fixture.db);

  try {
    const handler = createTeamsPostHandler(createTeamsRouteDeps());
    const request = new NextRequest('http://localhost/api/teams', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
      body: JSON.stringify({ name: 'New Team' })
    });
    const response = await handler(request);
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(payload, {
      name: 'New Team',
      shareId: 'generated-share-id'
    });

    const teamRow = await fixture.db.prepare('SELECT name, share_id FROM teams WHERE id = ?').get<{
      name: string;
      share_id: string;
    }>('generated-id');
    assert.ok(teamRow);
    assert.equal(teamRow.name, 'New Team');
    assert.equal(teamRow.share_id, 'generated-share-id');
  } finally {
    await fixture.cleanup();
  }
});

test('GET /api/teams/:shareId rewrites Google member pictures to avatar proxy', async () => {
  const fixture = await createPgRouteFixture('teamcal-teams-share-route');
  const nowIso = new Date().toISOString();
  await fixture.db
    .prepare(
      'INSERT INTO users (id, email, name, image, calendar_selection_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(
      'user-1',
      'owner@example.com',
      'Owner',
      null,
      '{}',
      nowIso,
      nowIso
    );
  await fixture.db
    .prepare(
      'INSERT INTO users (id, email, name, image, calendar_selection_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(
      'user-2',
      'member@example.com',
      'Member',
      'https://lh3.googleusercontent.com/a/team-member=s96-c',
      '{}',
      nowIso,
      nowIso
    );
  await fixture.db
    .prepare(
      'INSERT INTO teams (id, name, share_id, owner_id, privacy, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run('team-1', 'Core Team', 'share-1', 'user-1', 'public', nowIso, nowIso);
  await fixture.db
    .prepare(
      'INSERT INTO team_members (id, team_id, user_id, member_public_id, calendar_selection, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run('member-1', 'team-1', 'user-1', 'memberpubid01', null, nowIso, nowIso);
  await fixture.db
    .prepare(
      'INSERT INTO team_members (id, team_id, user_id, member_public_id, calendar_selection, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run('member-2', 'team-1', 'user-2', 'memberpubid02', null, nowIso, nowIso);

  try {
    const handler = createTeamGetHandler(createShareTeamRouteDeps());
    const response = await handler(new NextRequest('http://localhost/api/teams/share-1'), {
      params: Promise.resolve({ shareId: 'share-1' })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(
      payload.members.find((member: { memberPublicId: string }) => member.memberPublicId === 'memberpubid02')
        ?.picture,
      '/api/avatar?src=https%3A%2F%2Flh3.googleusercontent.com%2Fa%2Fteam-member%3Ds96-c'
    );
  } finally {
    await fixture.cleanup();
  }
});
