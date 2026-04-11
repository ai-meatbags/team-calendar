import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { GET as popupCompleteGet } from '../../auth/popup-complete/route';
import { createAuthGoogleHandler } from './google/handler';
import { createAuthLogoutHandler, resolveRedirectPath } from './logout/handler';
import { GOOGLE_AUTH_RECOVERY_COOKIE_NAME } from '@/infrastructure/auth/google-auth-flow';

test('GET /api/auth/google starts Google auth and preserves popup completion callback', async () => {
  const calls: Array<{
    provider: string | undefined;
    options: { redirect?: boolean; redirectTo?: string };
    authorizationParams?: Record<string, string> | string[][] | string | URLSearchParams;
  }> = [];
  const handler = createAuthGoogleHandler({
    signIn: async (provider, options, authorizationParams) => {
      calls.push({
        provider,
        options: options as { redirect?: boolean; redirectTo?: string },
        authorizationParams
      });
      return 'https://accounts.google.com/o/oauth2/v2/auth?state=test-state';
    }
  });

  const response = await handler(
    new Request('http://localhost/api/auth/google?popup=1&next=%2Ft%2Fshare-1%3Fduration%3D60')
  );

  assert.equal(response.status, 307);
  const location = response.headers.get('location');
  assert.ok(location);
  const redirectUrl = new URL(String(location));
  assert.equal(redirectUrl.origin, 'https://accounts.google.com');
  assert.equal(redirectUrl.searchParams.get('state'), 'test-state');
  assert.deepEqual(calls, [
    {
      provider: 'google',
      options: {
        redirect: false,
        redirectTo: '/auth/popup-complete?next=%2Ft%2Fshare-1%3Fduration%3D60'
      },
      authorizationParams: undefined
    }
  ]);
});

test('GET /api/auth/google enables hidden recovery mode when recovery cookie is present', async () => {
  const calls: Array<{
    provider: string | undefined;
    options: { redirect?: boolean; redirectTo?: string };
    authorizationParams?: Record<string, string> | string[][] | string | URLSearchParams;
  }> = [];
  const handler = createAuthGoogleHandler({
    signIn: async (provider, options, authorizationParams) => {
      calls.push({
        provider,
        options: options as { redirect?: boolean; redirectTo?: string },
        authorizationParams
      });
      return 'https://accounts.google.com/o/oauth2/v2/auth?state=recovery-state';
    }
  });

  const response = await handler(
    new Request('http://localhost/api/auth/google?next=%2Fprofile', {
      headers: {
        cookie: `${GOOGLE_AUTH_RECOVERY_COOKIE_NAME}=1`
      }
    })
  );

  assert.equal(response.status, 307);
  assert.equal(response.headers.get('location'), 'https://accounts.google.com/o/oauth2/v2/auth?state=recovery-state');
  assert.deepEqual(calls, [
    {
      provider: 'google',
      options: {
        redirect: false,
        redirectTo: '/profile'
      },
      authorizationParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  ]);
});

test('GET /auth/popup-complete returns popup bridge html', async () => {
  const response = await popupCompleteGet(
    new Request('http://localhost/auth/popup-complete?next=%2Ft%2Fshare-1')
  );
  const body = await response.text();
  const setCookie = response.headers.get('set-cookie');

  assert.equal(response.status, 200);
  assert.ok(setCookie);
  assert.match(String(setCookie), new RegExp(`${GOOGLE_AUTH_RECOVERY_COOKIE_NAME}=`));
  assert.match(body, /auth:success/);
  assert.match(body, /BroadcastChannel\('team-calendar-auth'\)/);
  assert.match(body, /team-calendar-auth-success/);
  assert.match(body, /window\.close\(\)/);
  assert.match(body, /window\.open\('', '_self'\)/);
  assert.match(body, /Sign-in completed\. You can close this window\./);
  assert.match(body, /var redirectPath = "\/t\/share-1";/);
  assert.match(body, /var continuePath = "\/";/);
  assert.match(body, /Continue to teams/);
});

test('resolveRedirectPath keeps only safe relative targets', async () => {
  assert.equal(resolveRedirectPath('/profile'), '/profile');
  assert.equal(resolveRedirectPath('https://evil.example'), '/');
  assert.equal(resolveRedirectPath('//evil.example'), '/');
});

test('GET /api/auth/logout signs out and redirects to safe next path', async () => {
  const calls: Array<{ redirect: false; redirectTo: string }> = [];
  const handler = createAuthLogoutHandler({
    isSameOriginRequest: () => true,
    signOut: async (params) => {
      calls.push(params);
    }
  });

  const response = await handler(
    new NextRequest('http://localhost/api/auth/logout?next=%2Fprofile', {
      headers: { referer: 'http://localhost/' }
    })
  );

  assert.equal(response.status, 307);
  assert.equal(response.headers.get('location'), 'http://localhost/profile');
  assert.deepEqual(calls, [{ redirect: false, redirectTo: '/profile' }]);
});

test('GET /api/auth/logout rejects invalid origin', async () => {
  const handler = createAuthLogoutHandler({
    isSameOriginRequest: () => false,
    signOut: async () => undefined
  });

  const response = await handler(new NextRequest('http://localhost/api/auth/logout'));
  const payload = await response.json();

  assert.equal(response.status, 403);
  assert.equal(payload.error, 'Invalid origin.');
});
