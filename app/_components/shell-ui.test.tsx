import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildUserMenuModel } from './header-model';
import { CreateView, LandingView, TeamsView } from './home-page-client';
import { resolveHomeMode } from './home-page-state';
import { ProfilePanel } from './profile-page-client';
import { shouldRedirectProfile } from './profile-state';

test('resolveHomeMode keeps guest create/list parity rules', () => {
  assert.equal(resolveHomeMode({ openCreateFromQuery: true, teamsCount: 2 }), 'create');
  assert.equal(resolveHomeMode({ openCreateFromQuery: false, teamsCount: 0 }), 'create');
  assert.equal(resolveHomeMode({ openCreateFromQuery: false, teamsCount: 3 }), 'teams');
});

test('LandingView renders key guest copy', () => {
  const html = renderToStaticMarkup(<LandingView status="" />);
  assert.match(html, /Google Calendar · Free\/Busy/);
  assert.match(html, /Мы не читаем события/);
  assert.match(html, /Только свободное время/);
});

test('TeamsView renders teams list and create action', () => {
  const html = renderToStaticMarkup(
    <TeamsView teams={[{ name: 'Core Team', shareId: 'share-1' }]} onCreate={() => undefined} />
  );
  assert.match(html, /Мои команды/);
  assert.match(html, /Core Team/);
  assert.match(html, /Создать команду/);
  assert.match(html, /\/t\/share-1/);
});

test('CreateView renders create form parity', () => {
  const html = renderToStaticMarkup(
    <CreateView onBack={() => undefined} onSubmit={async () => undefined} status="" />
  );
  assert.match(html, /Новая команда/);
  assert.match(html, /Имя команды/);
  assert.match(html, /Например: Партнеры/);
});

test('buildUserMenuModel returns expected menu entries', () => {
  const model = buildUserMenuModel([{ name: 'Partners', shareId: 'share-2' }]);
  assert.deepEqual(model.primaryLinks, [
    { href: '/profile', label: 'Профиль' },
    { href: '/', label: 'Все команды' }
  ]);
  assert.deepEqual(model.teamLinks, [{ href: '/t/share-2', label: 'Partners' }]);
  assert.equal(model.createLink.href, '/?create=1');
  assert.equal(model.logoutLabel, 'Выйти');
});

test('shouldRedirectProfile preserves profile guard parity', () => {
  assert.equal(shouldRedirectProfile({ hasUser: false, isLoading: true }), false);
  assert.equal(shouldRedirectProfile({ hasUser: false, isLoading: false }), true);
  assert.equal(shouldRedirectProfile({ hasUser: true, isLoading: false }), false);
});

test('ProfilePanel renders profile save UI', () => {
  const html = renderToStaticMarkup(
    <ProfilePanel
      nameDraft="Ivan"
      isSaving={false}
      onNameChange={() => undefined}
      onSubmit={async () => undefined}
    />
  );
  assert.match(html, /Профиль/);
  assert.match(html, /Измените отображаемое имя аккаунта/);
  assert.match(html, /Сохранить/);
});
