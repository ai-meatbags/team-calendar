import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  applyTeamPageSelectionPatch,
  buildTeamPageSelectionPatch,
  buildTeamPageShareToastMessage,
  canRenderJoinButton,
  getMemberDisplayName,
  getMemberStableKey,
  normalizeDurationQuery,
  normalizeTeamPrivacy,
  parseDurationQuery,
  patchSearchParams,
  resolveMemberQuery
} from './team-page-utils';
import { NotFoundPanel, SlotsView, TeamHeader } from './team-page-client';

test('parseDurationQuery accepts only 30 and 60', () => {
  assert.equal(parseDurationQuery('30'), 30);
  assert.equal(parseDurationQuery('60'), 60);
  assert.equal(parseDurationQuery(' 30 '), 30);
  assert.equal(parseDurationQuery('45'), null);
  assert.equal(parseDurationQuery('abc'), null);
  assert.equal(parseDurationQuery(''), null);
});

test('normalizeDurationQuery falls back to default on invalid values', () => {
  assert.deepEqual(normalizeDurationQuery('30'), { value: 30, isValid: true });
  assert.deepEqual(normalizeDurationQuery('60'), { value: 60, isValid: true });
  assert.deepEqual(normalizeDurationQuery('abc'), { value: 60, isValid: false });
  assert.deepEqual(normalizeDurationQuery('', 30), { value: 30, isValid: false });
});

test('resolveMemberQuery validates member id against current list', () => {
  const members = [{ memberPublicId: 'member_a' }, { memberPublicId: 'member_b' }];

  assert.deepEqual(resolveMemberQuery('', members), {
    selectedMemberPublicId: null,
    isValid: true
  });
  assert.deepEqual(resolveMemberQuery('member_a', members), {
    selectedMemberPublicId: 'member_a',
    isValid: true
  });
  assert.deepEqual(resolveMemberQuery('missing_member', members), {
    selectedMemberPublicId: null,
    isValid: false
  });
});

test('patchSearchParams keeps untouched params and avoids noop updates', () => {
  const initial = new URLSearchParams('member=member_a&duration=60');
  const updated = patchSearchParams(initial, (next) => {
    next.set('duration', '30');
  });
  assert.equal(updated.toString(), 'member=member_a&duration=30');

  const noop = patchSearchParams(updated as URLSearchParams, (next) => {
    next.set('duration', '30');
  });
  assert.equal(noop, updated);
});

test('selection patch helpers preserve calendar active flags', () => {
  const patch = buildTeamPageSelectionPatch({
    primary: { id: 'primary', title: 'Primary', active: true },
    secondary: { id: 'secondary', title: 'Secondary', active: false }
  });

  assert.deepEqual(patch, {
    primary: { active: true },
    secondary: { active: false }
  });

  assert.deepEqual(
    applyTeamPageSelectionPatch(
      { primary: { id: 'primary', title: 'Primary', active: false } },
      { primary: { active: true } },
      { primary: { id: 'primary', title: 'Primary', active: true } }
    ),
    { primary: { id: 'primary', title: 'Primary', active: true } }
  );
});

test('team privacy and member helpers preserve legacy parity', () => {
  assert.equal(normalizeTeamPrivacy('public'), 'public');
  assert.equal(normalizeTeamPrivacy(' PRIVATE '), 'private');
  assert.equal(normalizeTeamPrivacy('unknown'), 'public');
  assert.equal(
    canRenderJoinButton({ hasUser: false, isMember: false, canJoin: true }),
    false
  );
  assert.equal(
    canRenderJoinButton({ hasUser: true, isMember: false, canJoin: true }),
    true
  );
  assert.equal(getMemberDisplayName({ name: '', picture: null }), 'Участник');
  assert.equal(getMemberStableKey({ memberPublicId: 'member_123' }, 0), 'member_123');
});

test('share toast message preserves single-member and team variants', () => {
  assert.equal(
    buildTeamPageShareToastMessage('', 60),
    'Скопирована ссылка на расписание всей команды на 1 час'
  );
  assert.equal(
    buildTeamPageShareToastMessage('Иван', 30),
    'Скопирована ссылка на расписание участника Иван на 30 минут'
  );
});

test('TeamHeader renders member controls and action buttons for member state', () => {
  const html = renderToStaticMarkup(
    <TeamHeader
      teamName="Core Team"
      members={[{ name: 'Иван', memberPublicId: 'member_a', picture: null }]}
      isMembersLoading={false}
      isMember={true}
      hasUser={true}
      canJoin={false}
      selectedMemberPublicId={null}
      duration={60}
      onDurationChange={() => undefined}
      isSwitchesDisabled={false}
      onMemberFilterChange={() => undefined}
      onJoin={() => undefined}
      onShare={() => undefined}
      onOpenSettings={() => undefined}
    />
  );

  assert.match(html, /Core Team/);
  assert.match(html, /Поделиться/);
  assert.match(html, /Настройки команды/);
  assert.match(html, /Все участники/);
});

test('SlotsView renders empty and rules copy', () => {
  const html = renderToStaticMarkup(
    <SlotsView
      slots={[]}
      isLoading={false}
      slotsStatus=""
      onDismissStatus={() => undefined}
      onRefresh={() => undefined}
      settingsSummary={{
        days: 14,
        workdayStartHour: 10,
        workdayEndHour: 20,
        minNoticeHours: 12
      }}
      onSlotClick={() => undefined}
    />
  );

  assert.match(html, /Выбери слот/);
  assert.match(html, /Правила показа/);
  assert.match(html, /14 дней вперед/);
  assert.match(html, /10:00—20:00 МСК/);
  assert.match(html, /Свободных слотов не найдено/);
});

test('NotFoundPanel renders current empty state copy', () => {
  const html = renderToStaticMarkup(<NotFoundPanel />);
  assert.match(html, /Команда не найдена/);
  assert.match(html, /списку команд/);
});
