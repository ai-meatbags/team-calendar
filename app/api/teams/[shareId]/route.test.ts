import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { createDbClient } from '@/infrastructure/db/client';
import { createPgRouteFixture, type PgTestDatabase } from '../../test-support/pg-route-fixture';
import { createTeamSettingsGetHandler } from './settings/get-handler';
import {
  createTeamSlotRulesDeleteHandler,
  createTeamSlotRulesPatchHandler
} from './settings/slot-rules/handler';
import { createTeamDeleteHandler, createTeamPatchHandler } from './team-handler';

async function insertTeamSeedData(db: PgTestDatabase) {
  const nowIso = new Date().toISOString();
  await db
    .prepare(
      'INSERT INTO users (id, email, name, image, calendar_selection_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(
      'user-1',
      'owner@example.com',
      'Owner',
      null,
      '{"primary":{"active":true}}',
      nowIso,
      nowIso
    );
  await db
    .prepare(
      'INSERT INTO users (id, email, name, image, calendar_selection_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(
      'user-2',
      'member@example.com',
      'Member',
      null,
      '{"primary":{"active":false}}',
      nowIso,
      nowIso
    );
  await db
    .prepare(
      'INSERT INTO teams (id, name, share_id, owner_id, privacy, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run('team-1', 'Core Team', 'share-1', 'user-1', 'private', nowIso, nowIso);
  await db
    .prepare(
      'INSERT INTO team_members (id, team_id, user_id, member_public_id, calendar_selection, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(
      'member-1',
      'team-1',
      'user-1',
      'memberpubid01',
      '{"team-cal":{"active":true}}',
      nowIso,
      nowIso
    );
  await db
    .prepare(
      'INSERT INTO team_members (id, team_id, user_id, member_public_id, calendar_selection, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run('member-2', 'team-1', 'user-2', 'memberpubid02', null, nowIso, nowIso);
  await db
    .prepare(
      'INSERT INTO accounts (user_id, type, provider, provider_account_id, refresh_token) VALUES (?, ?, ?, ?, ?)'
    )
    .run('user-1', 'oauth', 'google', 'google-owner', 'enc-owner-token');
  await db
    .prepare(
      'INSERT INTO accounts (user_id, type, provider, provider_account_id, refresh_token) VALUES (?, ?, ?, ?, ?)'
    )
    .run('user-2', 'oauth', 'google', 'google-member', 'enc-member-token');
  await db
    .prepare(
      'INSERT INTO user_slot_rule_settings (id, user_id, days, workday_start_hour, workday_end_hour, min_notice_hours, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run('slot-rules-1', 'user-1', 14, 10, 20, 12, nowIso, nowIso);
  await db
    .prepare(
      'INSERT INTO user_slot_rule_settings (id, user_id, days, workday_start_hour, workday_end_hour, min_notice_hours, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run('slot-rules-2', 'user-2', 21, 11, 18, 24, nowIso, nowIso);
}

function createTeamRouteDeps(overrides: Record<string, unknown> = {}) {
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
    fetchCalendarList: async () => [
      { id: 'primary', summary: 'Primary' },
      { id: 'team-cal', summary: 'Team Calendar' }
    ],
    getConfig: () =>
      ({
        GOOGLE_CLIENT_ID: 'google-client-id',
        GOOGLE_CLIENT_SECRET: 'google-client-secret'
      }) as any,
    isSameOriginRequest: () => true,
    ...overrides
  };
}

test('GET /api/teams/:shareId/settings returns team id, merged selection and source parity', async () => {
  const fixture = await createPgRouteFixture('teamcal-team-route');
  await insertTeamSeedData(fixture.db);

  try {
    const handler = createTeamSettingsGetHandler(createTeamRouteDeps());
    const request = new NextRequest('http://localhost/api/teams/share-1/settings', {
      method: 'GET',
      headers: { origin: 'http://localhost:3000' }
    });
    const response = await handler(request, {
      params: Promise.resolve({ shareId: 'share-1' })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.team.id, 'team-1');
    assert.equal(payload.team.name, 'Core Team');
    assert.equal(payload.privacy, 'private');
    assert.equal(payload.canEditName, true);
    assert.equal(payload.canEditPrivacy, true);
    assert.equal(payload.canDelete, true);
    assert.equal(payload.calendarSelectionSource, 'team');
    assert.deepEqual(payload.mySlotRuleSettings, {
      source: 'default',
      values: {
        days: 14,
        workdayStartHour: 10,
        workdayEndHour: 20,
        minNoticeHours: 12
      },
      hasOverride: false
    });
    assert.deepEqual(payload.teamSlotRuleAggregate, {
      memberCount: 2,
      days: 21,
      workdayStartHour: 11,
      workdayEndHour: 18,
      minNoticeHours: 24
    });
    assert.equal(payload.owner.name, 'Owner');
    assert.deepEqual(payload.calendarSelection['team-cal'], {
      id: 'team-cal',
      title: 'Team Calendar',
      active: true
    });
  } finally {
    await fixture.cleanup();
  }
});

test('GET /api/teams/:shareId/settings normalizes invalid privacy to public for non-owner', async () => {
  const fixture = await createPgRouteFixture('teamcal-team-route');
  await insertTeamSeedData(fixture.db);
  await fixture.db.prepare('UPDATE teams SET privacy = ? WHERE id = ?').run('invalid', 'team-1');

  try {
    const handler = createTeamSettingsGetHandler(
      createTeamRouteDeps({
        auth: async () =>
          ({
            user: {
              id: 'user-2',
              email: 'member@example.com'
            }
          }) as any
      })
    );
    const request = new NextRequest('http://localhost/api/teams/share-1/settings', {
      method: 'GET',
      headers: { origin: 'http://localhost:3000' }
    });
    const response = await handler(request, {
      params: Promise.resolve({ shareId: 'share-1' })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.privacy, 'public');
    assert.equal(payload.canEditPrivacy, false);
    assert.equal(payload.calendarSelectionSource, 'default');
    assert.equal(payload.owner.name, 'Owner');
  } finally {
    await fixture.cleanup();
  }
});

test('PATCH /api/teams/:shareId denies privacy update for non-owner with legacy message', async () => {
  const fixture = await createPgRouteFixture('teamcal-team-route');
  await insertTeamSeedData(fixture.db);

  try {
    const handler = createTeamPatchHandler(
      createTeamRouteDeps({
        auth: async () =>
          ({
            user: {
              id: 'user-2',
              email: 'member@example.com'
            }
          }) as any
      })
    );
    const request = new NextRequest('http://localhost/api/teams/share-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
      body: JSON.stringify({ privacy: 'private' })
    });
    const response = await handler(request, {
      params: Promise.resolve({ shareId: 'share-1' })
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.error, 'Only owner can edit team privacy.');
  } finally {
    await fixture.cleanup();
  }
});

test('PATCH /api/teams/:shareId returns calendarSelection payload even when name also changed', async () => {
  const fixture = await createPgRouteFixture('teamcal-team-route');
  await insertTeamSeedData(fixture.db);

  try {
    const handler = createTeamPatchHandler(createTeamRouteDeps());
    const request = new NextRequest('http://localhost/api/teams/share-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
      body: JSON.stringify({
        name: 'Renamed Team',
        calendarSelection: {
          primary: { active: true }
        }
      })
    });
    const response = await handler(request, {
      params: Promise.resolve({ shareId: 'share-1' })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(Object.prototype.hasOwnProperty.call(payload, 'updated'), false);
    assert.deepEqual(payload.calendarSelection.primary, {
      id: 'primary',
      title: 'Primary',
      active: true
    });

    const teamRow = await fixture.db.prepare('SELECT name FROM teams WHERE id = ?').get<{
      name: string;
    }>('team-1');
    assert.ok(teamRow);
    assert.equal(teamRow.name, 'Renamed Team');
  } finally {
    await fixture.cleanup();
  }
});

test('PATCH /api/teams/:shareId validates privacy enum', async () => {
  const fixture = await createPgRouteFixture('teamcal-team-route');
  await insertTeamSeedData(fixture.db);

  try {
    const handler = createTeamPatchHandler(createTeamRouteDeps());
    const request = new NextRequest('http://localhost/api/teams/share-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
      body: JSON.stringify({ privacy: 'secret' })
    });
    const response = await handler(request, {
      params: Promise.resolve({ shareId: 'share-1' })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.error, 'Invalid privacy value.');
  } finally {
    await fixture.cleanup();
  }
});

test('PATCH /api/teams/:shareId/settings/slot-rules creates personal override for current member', async () => {
  const fixture = await createPgRouteFixture('teamcal-team-route');
  await insertTeamSeedData(fixture.db);

  try {
    const handler = createTeamSlotRulesPatchHandler({
      ...createTeamRouteDeps(),
      generateId: () => 'override-1'
    } as any);
    const request = new NextRequest('http://localhost/api/teams/share-1/settings/slot-rules', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
      body: JSON.stringify({
        slotRuleOverride: {
          days: 30,
          workdayStartHour: 12,
          workdayEndHour: 17,
          minNoticeHours: 48
        }
      })
    });
    const response = await handler(request, {
      params: Promise.resolve({ shareId: 'share-1' })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload.slotRuleOverride, {
      days: 30,
      workdayStartHour: 12,
      workdayEndHour: 17,
      minNoticeHours: 48
    });

    const row = await fixture.db
      .prepare('SELECT days, workday_start_hour, workday_end_hour, min_notice_hours FROM team_member_slot_rule_overrides WHERE team_member_id = ?')
      .get<{
        days: number;
        workday_start_hour: number;
        workday_end_hour: number;
        min_notice_hours: number;
      }>('member-1');
    assert.ok(row);
    assert.deepEqual(row, {
      days: 30,
      workday_start_hour: 12,
      workday_end_hour: 17,
      min_notice_hours: 48
    });
  } finally {
    await fixture.cleanup();
  }
});

test('DELETE /api/teams/:shareId/settings/slot-rules removes current member override', async () => {
  const fixture = await createPgRouteFixture('teamcal-team-route');
  await insertTeamSeedData(fixture.db);
  await fixture.db
    .prepare(
      'INSERT INTO team_member_slot_rule_overrides (id, team_member_id, days, workday_start_hour, workday_end_hour, min_notice_hours, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run('override-1', 'member-1', 30, 12, 17, 48, new Date().toISOString(), new Date().toISOString());

  try {
    const handler = createTeamSlotRulesDeleteHandler({
      ...createTeamRouteDeps(),
      generateId: () => 'unused'
    } as any);
    const request = new NextRequest('http://localhost/api/teams/share-1/settings/slot-rules', {
      method: 'DELETE',
      headers: { origin: 'http://localhost:3000' }
    });
    const response = await handler(request, {
      params: Promise.resolve({ shareId: 'share-1' })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, { deleted: true });

    const row = await fixture.db
      .prepare('SELECT id FROM team_member_slot_rule_overrides WHERE team_member_id = ?')
      .get('member-1');
    assert.equal(row, undefined);
  } finally {
    await fixture.cleanup();
  }
});

test('DELETE /api/teams/:shareId deletes team for owner', async () => {
  const fixture = await createPgRouteFixture('teamcal-team-route');
  await insertTeamSeedData(fixture.db);

  try {
    const handler = createTeamDeleteHandler(createTeamRouteDeps());
    const request = new NextRequest('http://localhost/api/teams/share-1', {
      method: 'DELETE',
      headers: { origin: 'http://localhost:3000' }
    });
    const response = await handler(request, {
      params: Promise.resolve({ shareId: 'share-1' })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, { deleted: true });

    const teamRow = await fixture.db.prepare('SELECT id FROM teams WHERE id = ?').get('team-1');
    const memberRows = await fixture.db.prepare('SELECT COUNT(*) as count FROM team_members WHERE team_id = ?').get<{ count: number }>('team-1');
    assert.ok(memberRows);
    assert.equal(teamRow, undefined);
    assert.equal(memberRows.count, 0);
  } finally {
    await fixture.cleanup();
  }
});

test('DELETE /api/teams/:shareId denies delete for non-owner', async () => {
  const fixture = await createPgRouteFixture('teamcal-team-route');
  await insertTeamSeedData(fixture.db);

  try {
    const handler = createTeamDeleteHandler(
      createTeamRouteDeps({
        auth: async () =>
          ({
            user: {
              id: 'user-2',
              email: 'member@example.com'
            }
          }) as any
      })
    );
    const request = new NextRequest('http://localhost/api/teams/share-1', {
      method: 'DELETE',
      headers: { origin: 'http://localhost:3000' }
    });
    const response = await handler(request, {
      params: Promise.resolve({ shareId: 'share-1' })
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.error, 'Only owner can delete team.');
  } finally {
    await fixture.cleanup();
  }
});
