import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  canRenderJoinButton,
  getMemberDisplayName,
  getMemberStableKey,
  normalizeTeamPrivacy
} from './team-page-members';
import {
  applyTeamPageSelectionPatch,
  buildTeamPageSelectionPatch,
  normalizeDurationQuery,
  parseDurationQuery,
  patchSearchParams,
  resolveMemberQuery
} from './team-page-query-state';
import { buildTeamPageShareToastMessage } from './team-page-time';
import type { TeamWebhookItem } from './team-page-types';
import { formatWeekRange, groupSlotsByWeek } from './team-page-week-groups';
import { TeamHeader } from './team-page-header';
import { NotFoundPanel } from './team-page-empty-state';
import { parseStoredSlotViewMode, SlotsView } from './team-page-slots-section';
import { TeamSettingsCalendarsCard } from './team-settings-calendars-card';
import { TeamSlotRuleSettingsSection } from './team-slot-rule-settings-section';
import { buildWeekGridDays, buildWeekGridTimeline } from './team-page-slot-view-model';
import { TeamWebhookSettingsSection } from './team-webhook-settings-section';
import type { TeamWebhookSettingsViewModel } from './team-webhook-settings-contract';

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

test('parseStoredSlotViewMode keeps only supported persisted values', () => {
  assert.equal(parseStoredSlotViewMode('week'), 'week');
  assert.equal(parseStoredSlotViewMode('list'), 'list');
  assert.equal(parseStoredSlotViewMode('unknown'), 'week');
  assert.equal(parseStoredSlotViewMode(null, 'list'), 'list');
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

test('groupSlotsByWeek splits day groups into Monday-based week sections', () => {
  const grouped = groupSlotsByWeek([
    {
      start: '2026-04-10T09:00:00.000Z',
      end: '2026-04-10T10:00:00.000Z',
      members: []
    },
    {
      start: '2026-04-12T09:00:00.000Z',
      end: '2026-04-12T10:00:00.000Z',
      members: []
    },
    {
      start: '2026-04-13T09:00:00.000Z',
      end: '2026-04-13T10:00:00.000Z',
      members: []
    }
  ]);

  assert.equal(grouped.length, 2);
  assert.equal(grouped[0]?.label, 'Апрель, 6 - 12');
  assert.equal(grouped[0]?.weekNumber, 15);
  assert.equal(grouped[0]?.days.length, 2);
  assert.equal(grouped[1]?.label, 'Апрель, 13 - 19');
  assert.equal(grouped[1]?.weekNumber, 16);
  assert.equal(grouped[1]?.days.length, 1);
});

test('buildWeekGridDays keeps empty days visible in week mode', () => {
  const grouped = groupSlotsByWeek([
    {
      start: '2026-04-13T09:00:00.000Z',
      end: '2026-04-13T10:00:00.000Z',
      members: []
    },
    {
      start: '2026-04-15T09:00:00.000Z',
      end: '2026-04-15T10:00:00.000Z',
      members: []
    }
  ]);

  const week = grouped[0];
  assert.ok(week);

  const days = buildWeekGridDays(week);

  assert.equal(days.length, 7);
  assert.equal(days[0]?.title, '13 апр.');
  assert.equal(days[1]?.isEmpty, true);
  assert.equal(days[2]?.slots.length, 1);
  assert.equal(days[6]?.weekday, 'воскресенье');
});

test('buildWeekGridTimeline uses available slot bounds instead of workday window when slots exist', () => {
  const grouped = groupSlotsByWeek([
    {
      start: '2026-04-13T07:00:00.000Z',
      end: '2026-04-13T08:00:00.000Z',
      members: []
    },
    {
      start: '2026-04-13T14:00:00.000Z',
      end: '2026-04-13T15:00:00.000Z',
      members: []
    }
  ]);

  const timeline = buildWeekGridTimeline({
    workdayStartHour: 8,
    workdayEndHour: 20,
    weeks: grouped
  });

  assert.equal(timeline.startHour, 10);
  assert.equal(timeline.endHour, 18);
  assert.equal(timeline.rowCount, 8);
});

test('formatWeekRange keeps month compact for same-month weeks', () => {
  assert.equal(
    formatWeekRange(new Date('2026-04-06T12:00:00.000Z'), new Date('2026-04-12T12:00:00.000Z')),
    'Апрель, 6 - 12'
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
      settingsHref="/t/share-1/settings"
    />
  );

  assert.match(html, /Core Team/);
  assert.match(html, /Поделиться/);
  assert.match(html, /Настройки команды/);
  assert.match(html, /\/t\/share-1\/settings/);
  assert.doesNotMatch(html, /Все участники/);
  assert.match(html, /Иван/);
});

test('TeamHeader keeps single member filter non-interactive', () => {
  const html = renderToStaticMarkup(
    <TeamHeader
      teamName="Solo Team"
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
      settingsHref="/t/share-1/settings"
    />
  );

  assert.match(html, /team-member-toggle__segment is-active/);
  assert.doesNotMatch(html, /team-member-toggle__button is-active/);
  assert.doesNotMatch(html, /disabled=""/);
  assert.doesNotMatch(html, /Все участники/);
});

test('SlotsView renders empty and rules copy', () => {
  const html = renderToStaticMarkup(
    <SlotsView
      slots={[]}
      isLoading={false}
      hasLoadedOnce={true}
      slotsStatus=""
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
  assert.match(html, /Свободных слотов пока нет/);
});

test('SlotsView renders week section headings above day groups', () => {
  const html = renderToStaticMarkup(
    <SlotsView
      slots={[
        {
          start: '2026-04-10T09:00:00.000Z',
          end: '2026-04-10T10:00:00.000Z',
          members: []
        },
        {
          start: '2026-04-13T09:00:00.000Z',
          end: '2026-04-13T10:00:00.000Z',
          members: []
        }
      ]}
      isLoading={false}
      hasLoadedOnce={true}
      slotsStatus=""
      settingsSummary={{
        days: 14,
        workdayStartHour: 10,
        workdayEndHour: 20,
        minNoticeHours: 12
      }}
      onSlotClick={() => undefined}
    />
  );

  assert.match(html, /week-group__range">Апрель, 6 - 12/);
  assert.match(html, /week-group__week-number">w15/);
  assert.match(html, /week-group__range">Апрель, 13 - 19/);
  assert.match(html, /week-group__week-number">w16/);
});

test('SlotsView renders desktop toggle with icons and labels and defaults to week mode', () => {
  const html = renderToStaticMarkup(
    <SlotsView
      slots={[
        {
          start: '2026-04-13T09:00:00.000Z',
          end: '2026-04-13T10:00:00.000Z',
          members: []
        }
      ]}
      isLoading={false}
      hasLoadedOnce={true}
      slotsStatus=""
      settingsSummary={{
        days: 14,
        workdayStartHour: 10,
        workdayEndHour: 20,
        minNoticeHours: 12
      }}
      onSlotClick={() => undefined}
      viewportMode="desktop"
    />
  );

  assert.match(html, /slot-view-toggle/);
  assert.match(html, /data-slot-view-mode="week"/);
  assert.match(html, /Режим список/);
  assert.match(html, /Режим неделя/);
  assert.match(html, />Список</);
  assert.match(html, />Неделя</);
});

test('SlotsView renders week grid with empty days when desktop week mode is active', () => {
  const html = renderToStaticMarkup(
    <SlotsView
      slots={[
        {
          start: '2026-04-13T09:00:00.000Z',
          end: '2026-04-13T10:00:00.000Z',
          members: []
        },
        {
          start: '2026-04-15T12:00:00.000Z',
          end: '2026-04-15T13:00:00.000Z',
          members: []
        }
      ]}
      isLoading={false}
      hasLoadedOnce={true}
      slotsStatus=""
      settingsSummary={{
        days: 14,
        workdayStartHour: 10,
        workdayEndHour: 20,
        minNoticeHours: 12
      }}
      onSlotClick={() => undefined}
      viewportMode="desktop"
      initialViewMode="week"
    />
  );

  assert.match(html, /data-slot-view-mode="week"/);
  assert.match(html, /week-group__days week-group__days--grid/);
  assert.equal((html.match(/class="week-day-column(?: |")/g) || []).length, 7);
  assert.match(html, /week-day-column--empty/);
  assert.match(html, /Нет слотов/);
  assert.match(html, /slot-card slot-card--compact/);
});

test('SlotsView renders concise error state on availability failure', () => {
  const html = renderToStaticMarkup(
    <SlotsView
      slots={[]}
      isLoading={false}
      hasLoadedOnce={true}
      slotsStatus="Не удалось загрузить свободные слоты"
      settingsSummary={null}
      onSlotClick={() => undefined}
    />
  );

  assert.match(html, /Не удалось загрузить свободные слоты/);
  assert.doesNotMatch(html, /Правила показа/);
  assert.doesNotMatch(html, /Свободных слотов пока нет/);
});

test('SlotsView falls back to list mode on mobile even when week is requested', () => {
  const html = renderToStaticMarkup(
    <SlotsView
      slots={[
        {
          start: '2026-04-13T09:00:00.000Z',
          end: '2026-04-13T10:00:00.000Z',
          members: []
        }
      ]}
      isLoading={false}
      hasLoadedOnce={true}
      slotsStatus=""
      settingsSummary={{
        days: 14,
        workdayStartHour: 10,
        workdayEndHour: 20,
        minNoticeHours: 12
      }}
      onSlotClick={() => undefined}
      viewportMode="mobile"
      initialViewMode="week"
    />
  );

  assert.doesNotMatch(html, /slot-view-toggle/);
  assert.match(html, /data-slot-view-mode="list"/);
  assert.doesNotMatch(html, /week-group__days week-group__days--grid/);
  assert.match(html, /day-group__title/);
});

test('SlotsView renders week-band header markup ahead of week day groups', () => {
  const html = renderToStaticMarkup(
    <SlotsView
      slots={[
        {
          start: '2026-04-10T09:00:00.000Z',
          end: '2026-04-10T10:00:00.000Z',
          members: []
        },
        {
          start: '2026-04-13T09:00:00.000Z',
          end: '2026-04-13T10:00:00.000Z',
          members: []
        }
      ]}
      isLoading={false}
      hasLoadedOnce={true}
      slotsStatus=""
      settingsSummary={{
        days: 14,
        workdayStartHour: 10,
        workdayEndHour: 20,
        minNoticeHours: 12
      }}
      onSlotClick={() => undefined}
    />
  );

  assert.match(html, /week-group__header-copy/);
  assert.match(html, /week-group__range/);
  assert.match(html, /week-group__header[\s\S]*week-group__days/);
});

test('SlotsView keeps skeleton visible before first availability response', () => {
  const html = renderToStaticMarkup(
    <SlotsView
      slots={[]}
      isLoading={false}
      hasLoadedOnce={false}
      slotsStatus=""
      settingsSummary={null}
      onSlotClick={() => undefined}
    />
  );

  assert.match(html, /slots-skeleton/);
  assert.doesNotMatch(html, /Свободных слотов пока нет/);
  assert.doesNotMatch(html, /Не удалось загрузить свободные слоты/);
});

test('NotFoundPanel renders current empty state copy', () => {
  const html = renderToStaticMarkup(<NotFoundPanel />);
  assert.match(html, /Команда не найдена/);
  assert.match(html, /списку команд/);
});

function createWebhookSettingsModel(overrides: Partial<TeamWebhookSettingsViewModel> = {}): TeamWebhookSettingsViewModel {
  const baseWebhook: TeamWebhookItem = {
    id: 'webhook-1',
    targetUrl: 'https://hooks.example.com/booking',
    audience: 'team-webhook:webhook-1',
    isActive: true,
    secretStatus: 'configured',
    requiresProvisioning: false,
    lastDeliveryStatus: 'success'
  };

  const model: TeamWebhookSettingsViewModel = {
    webhookDraft: null,
    setWebhookDraftUrl: () => undefined,
    cancelWebhookDraft: () => undefined,
    beginWebhookDraft: async () => undefined,
    isWebhooksLoading: false,
    webhookCreatePending: false,
    webhookActionPendingId: null,
    webhookProvisioning: null,
    webhookGuideHref: '/docs/team-webhooks',
    handleWebhookAdd: async () => true,
    handleWebhookToggle: async () => undefined,
    handleWebhookRotate: async () => undefined,
    confirmWebhookDelete: async () => undefined,
    dismissWebhookProvisioning: () => undefined,
    handleWebhookProvisioningCopy: async () => undefined,
    formatTeamWebhookActivityLabel: () => 'Успешно 2 апреля, 12:23',
    webhooks: [baseWebhook]
  };

  return {
    ...model,
    ...overrides,
    webhooks: overrides.webhooks ?? model.webhooks
  };
}

test('TeamWebhookSettingsSection renders onboarding empty state', () => {
  const html = renderToStaticMarkup(
    <TeamWebhookSettingsSection
      teamSettings={createWebhookSettingsModel({
        webhooks: []
      })}
      onOpenCreate={() => undefined}
      canManage={true}
    />
  );

  assert.match(html, /Вебхуков пока нет/);
  assert.match(html, /Добавить вебхук/);
  assert.doesNotMatch(html, /Audience/);
});

test('TeamWebhookSettingsSection renders skeleton while webhooks are loading', () => {
  const html = renderToStaticMarkup(
    <TeamWebhookSettingsSection
      teamSettings={createWebhookSettingsModel({
        isWebhooksLoading: true,
        webhooks: []
      })}
      onOpenCreate={() => undefined}
      canManage={true}
    />
  );

  assert.match(html, /animate-pulse/);
});

test('TeamWebhookSettingsSection renders row-scoped provisioning secret and webhook rows without audience', () => {
  const html = renderToStaticMarkup(
    <TeamWebhookSettingsSection
      teamSettings={createWebhookSettingsModel({
        webhookProvisioning: {
          webhookId: 'webhook-1',
          targetUrl: 'https://hooks.example.com/booking',
          audience: 'team-webhook:webhook-1',
          sharedSecret: 'secret-123'
        }
      })}
      onOpenCreate={() => undefined}
      canManage={true}
    />
  );

  assert.match(html, /Секрет обновлён/);
  assert.match(html, /secret-123/);
  assert.match(html, /Скопировать/);
  assert.match(html, /POST/);
  assert.match(html, /Обновить секрет/);
  assert.match(html, /Удалить/);
  assert.doesNotMatch(html, /Успешно 2 апреля, 12:23/);
  assert.doesNotMatch(html, /Audience/);
  assert.doesNotMatch(html, /Shared secret/);
});

test('TeamWebhookSettingsSection renders draft row with inline secret before save', () => {
  const html = renderToStaticMarkup(
    <TeamWebhookSettingsSection
      teamSettings={createWebhookSettingsModel({
        webhooks: [],
        webhookDraft: {
          targetUrl: '',
          provisioningToken: 'enc:draft',
          sharedSecret: 'draft-secret-123'
        }
      })}
      onOpenCreate={() => undefined}
      canManage={true}
    />
  );

  assert.match(html, /Новый JWT вебхук/);
  assert.match(html, /Сделай POST вебхук/);
  assert.match(html, /Статус: ещё не создан/);
  assert.match(html, /draft-secret-123/);
  assert.match(html, /Сохранить вебхук/);
  assert.match(html, /Webhook URL/);
});

test('TeamSlotRuleSettingsSection renders team-specific slot rule controls', () => {
  const html = renderToStaticMarkup(
    <TeamSlotRuleSettingsSection
      draft={{
        days: 21,
        workdayStartHour: 11,
        workdayEndHour: 18,
        minNoticeHours: 24
      }}
      hasOverride={true}
      isLoading={false}
      isSaving={false}
      onChange={() => undefined}
      onReset={async () => undefined}
    />
  );

  assert.match(html, /Мои правила слотов/);
  assert.doesNotMatch(html, /Сохранить правила/);
  assert.match(html, /Сбросить до настроек из профиля/);
});

test('TeamSettingsCalendarsCard renders fixed-shell calendar section copy', () => {
  const html = renderToStaticMarkup(
    <TeamSettingsCalendarsCard
      selection={{
        primary: { id: 'primary', title: 'Primary', active: true },
        backup: { id: 'backup', title: 'Backup', active: false }
      }}
      isLoading={false}
      isSaving={false}
      onChange={() => undefined}
    />
  );

  assert.match(html, /Календари/);
  assert.match(html, /team-settings-calendar-shell/);
  assert.match(html, /Primary/);
  assert.match(html, /Backup/);
});
