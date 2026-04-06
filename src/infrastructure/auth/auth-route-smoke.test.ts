import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { createPgRouteFixture } from '../../../app/api/test-support/pg-route-fixture';

type AuthRouteModule = {
  runtime: string;
  GET: (request: NextRequest, context?: { params?: { nextauth?: string[] } }) => Promise<Response>;
  POST: (request: NextRequest, context?: { params?: { nextauth?: string[] } }) => Promise<Response>;
};

let cachedRoute: Promise<AuthRouteModule> | null = null;
let authFixture: Awaited<ReturnType<typeof createPgRouteFixture>> | null = null;

function applyAuthTestEnv() {
  const env = process.env as Record<string, string | undefined>;
  env.NODE_ENV = 'test';
  env.TOKEN_ENC_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  env.GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID || 'test-google-client-id';
  env.GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET || 'test-google-client-secret';
  env.NEXTAUTH_SECRET = env.NEXTAUTH_SECRET || 'test-nextauth-secret';
  env.NEXTAUTH_URL = 'http://localhost:3000';
}

async function ensureAuthFixture() {
  if (!authFixture) {
    authFixture = await createPgRouteFixture('teamcal-auth-route-smoke');
  }
  return authFixture;
}

async function loadAuthRoute() {
  if (!cachedRoute) {
    await ensureAuthFixture();
    applyAuthTestEnv();
    cachedRoute = import('../../../app/api/auth/[...nextauth]/route').then((mod) => {
      const route = (mod as any).default ?? mod;
      return route as AuthRouteModule;
    });
  }
  return cachedRoute;
}

test.after(async () => {
  if (authFixture) {
    await authFixture.cleanup();
  }
});

test('nextauth route exports node runtime and handlers', async () => {
  const route = await loadAuthRoute();
  assert.equal(route.runtime, 'nodejs');
  assert.equal(typeof route.GET, 'function');
  assert.equal(typeof route.POST, 'function');
});

test('nextauth session route returns unauthenticated success contract', async () => {
  const route = await loadAuthRoute();
  const response = await route.GET(
    new NextRequest('http://localhost:3000/api/auth/session'),
    { params: { nextauth: ['session'] } }
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'null');
});

test('nextauth callback route returns failure redirect contract when oauth callback fails', async () => {
  const route = await loadAuthRoute();
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    const response = await route.GET(
      new NextRequest('http://localhost:3000/api/auth/callback/google?error=access_denied'),
      { params: { nextauth: ['callback', 'google'] } }
    );

    assert.equal(response.status, 302);
    const location = response.headers.get('location');
    assert.ok(location);
    assert.match(location, /\/api\/auth\/error\?error=Configuration$/);
  } finally {
    console.error = originalConsoleError;
  }
});
