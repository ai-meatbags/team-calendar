import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildUserMenuModel } from './header-model';
import { CreateTeamView } from './create-team-view';
import { LandingView } from './landing-view';
import { ProfileSettingsCard } from './profile-settings-card';
import { TeamsView } from './teams-view';
import { shouldRedirectProfile } from './profile-state';

test('LandingView renders key guest copy', () => {
  const html = renderToStaticMarkup(<LandingView status="" />);
  assert.match(html, /Google Calendar · Free\/Busy/);
  assert.match(html, /Мы не читаем события/);
  assert.match(html, /Только свободное время/);
  assert.match(html, /Войдём в существующий аккаунт или создадим новый автоматически/);
});

test('TeamsView renders teams list and create action', () => {
  const html = renderToStaticMarkup(
    <TeamsView
      teams={[
        {
          name: 'Core Team',
          shareId: 'share-1',
          members: [
            { name: 'Owner', picture: null },
            { name: 'Member', picture: 'https://example.com/avatar.png' }
          ],
          myAvailability: {
            workdayStartHour: 10,
            workdayEndHour: 20
          }
        }
      ]}
    />
  );
  assert.match(html, /Мои команды/);
  assert.match(html, /profile-settings-card__header/);
  assert.match(html, /Core Team/);
  assert.match(html, /Создать команду/);
  assert.match(html, /team-card--create/);
  assert.match(html, /\/teams\/new/);
  assert.match(html, /\/t\/share-1/);
  assert.match(html, /Мой интервал/);
  assert.match(html, /10:00-20:00/);
});

test('CreateView renders create form parity', () => {
  const html = renderToStaticMarkup(
    <CreateTeamView onSubmit={async () => undefined} status="" />
  );
  assert.match(html, /Новая команда/);
  assert.match(html, /Имя команды/);
  assert.match(html, /Например: Партнеры/);
  assert.match(html, /href=\"\/teams\"/);
});

test('buildUserMenuModel returns expected menu entries', () => {
  const model = buildUserMenuModel([
    {
      name: 'Partners',
      shareId: 'share-2',
      members: [],
      myAvailability: null
    }
  ]);
  assert.deepEqual(model.primaryLinks, [
    { href: '/profile', label: 'Профиль' },
    { href: '/teams', label: 'Все команды' }
  ]);
  assert.deepEqual(model.teamLinks, [{ href: '/t/share-2', label: 'Partners' }]);
  assert.equal(model.createLink.href, '/teams/new');
  assert.equal(model.logoutLabel, 'Выйти');
});

test('shouldRedirectProfile preserves profile guard parity', () => {
  assert.equal(shouldRedirectProfile({ hasUser: false, isLoading: true }), false);
  assert.equal(shouldRedirectProfile({ hasUser: false, isLoading: false }), true);
  assert.equal(shouldRedirectProfile({ hasUser: true, isLoading: false }), false);
});

test('ProfileSettingsCard renders unified profile settings UI', () => {
  const html = renderToStaticMarkup(
    <ProfileSettingsCard
      nameDraft="Ivan"
      isSaving={false}
      slotRuleSettings={{
        days: 14,
        workdayStartHour: 10,
        workdayEndHour: 20,
        minNoticeHours: 12
      }}
      isLoadingSlotRules={false}
      status=""
      onNameChange={() => undefined}
      onSubmit={async () => undefined}
      onSlotRuleChange={() => undefined}
    />
  );
  assert.match(html, /Профиль/);
  assert.match(html, /Имя аккаунта/);
  assert.match(html, /Правила поиска доступных слотов/);
  assert.match(html, /Окно показа, дней/);
  assert.match(html, /Кто видит имя аккаунта/);
  assert.match(html, /Это имя увидят участники команды и гости страницы бронирования/i);
  assert.doesNotMatch(html, /Управляйте отображаемым именем и личными правилами слотов в одном месте/i);
  assert.doesNotMatch(html, /сброса командных переопределений/i);
  assert.match(html, /Сохранить/);
  assert.doesNotMatch(html, /Сохранить имя/);
  assert.doesNotMatch(html, /Сохранить правила/);
});
