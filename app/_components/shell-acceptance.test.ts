import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  buildAuthPopupUrl,
  buildLogoutUrl,
  shouldAcceptAuthMessage
} from './auth-state';
import { buildCreatedTeamPath, LANDING_SCREENSHOT_PATH, resolveCreateBackMode } from './home-page-state';
import {
  resolveUserMenuState,
  shouldShowEmptyTeamsMessage
} from './header-model';
import { shouldRedirectProfile } from './profile-state';

const repoRoot = process.cwd();

test('Next shell uses local styles instead of legacy frontend imports', () => {
  const layoutSource = readFileSync(path.join(repoRoot, 'app/layout.tsx'), 'utf8');

  assert.match(layoutSource, /import '\.\/styles\/tailwind\.css'/);
  assert.match(layoutSource, /import '\.\/styles\/styles\.css'/);
  assert.doesNotMatch(layoutSource, /\.\.\/frontend\//);
});

test('landing assets are available under Next public runtime paths', () => {
  assert.equal(LANDING_SCREENSHOT_PATH, '/img/screen.png');
  assert.equal(existsSync(path.join(repoRoot, 'public/img/screen.png')), true);
  assert.equal(existsSync(path.join(repoRoot, 'public/favicon.svg')), true);
});

test('auth popup and logout urls preserve current pathname and query', () => {
  assert.equal(
    buildAuthPopupUrl('/profile', '?tab=settings'),
    '/auth/google?popup=1&next=%2Fprofile%3Ftab%3Dsettings'
  );
  assert.equal(
    buildLogoutUrl('/profile', '?tab=settings'),
    '/auth/logout?next=%2Fprofile%3Ftab%3Dsettings'
  );
});

test('auth message acceptance keeps same-origin and same-hostname popup parity', () => {
  assert.equal(
    shouldAcceptAuthMessage({
      eventOrigin: 'http://localhost:3000',
      windowOrigin: 'http://localhost:3000',
      windowHostname: 'localhost'
    }),
    true
  );
  assert.equal(
    shouldAcceptAuthMessage({
      eventOrigin: 'https://localhost:3000',
      windowOrigin: 'http://localhost:3000',
      windowHostname: 'localhost'
    }),
    true
  );
  assert.equal(
    shouldAcceptAuthMessage({
      eventOrigin: 'https://evil.example',
      windowOrigin: 'http://localhost:3000',
      windowHostname: 'localhost'
    }),
    false
  );
});

test('user menu reducer preserves acceptance open-close behavior', () => {
  assert.equal(
    resolveUserMenuState({
      action: 'trigger-click',
      hasUser: true,
      isOpen: false,
      canUseHover: false
    }),
    true
  );
  assert.equal(
    resolveUserMenuState({
      action: 'select-item',
      hasUser: true,
      isOpen: true,
      canUseHover: false
    }),
    false
  );
  assert.equal(
    resolveUserMenuState({
      action: 'outside-click',
      hasUser: true,
      isOpen: true,
      canUseHover: false
    }),
    false
  );
  assert.equal(
    resolveUserMenuState({
      action: 'escape',
      hasUser: true,
      isOpen: true,
      canUseHover: false
    }),
    false
  );
});

test('home and profile acceptance helpers preserve create-team and redirect behavior', () => {
  assert.equal(resolveCreateBackMode(), 'teams');
  assert.equal(buildCreatedTeamPath('share-123'), '/t/share-123');
  assert.equal(shouldShowEmptyTeamsMessage({ hasTeamsLoaded: true, teamsCount: 0 }), true);
  assert.equal(shouldShowEmptyTeamsMessage({ hasTeamsLoaded: false, teamsCount: 0 }), false);
  assert.equal(shouldRedirectProfile({ hasUser: false, isLoading: false }), true);
});

test('profile page keeps route-level server redirect guard', () => {
  const profilePageSource = readFileSync(
    path.join(repoRoot, 'app/(pages)/profile/page.tsx'),
    'utf8'
  );

  assert.match(profilePageSource, /import \{ redirect \} from 'next\/navigation'/);
  assert.match(profilePageSource, /const session = await resolveProfileSession\(\)/);
  assert.match(profilePageSource, /if \(!session\?\.user\) \{\s*redirect\('\//);
});
