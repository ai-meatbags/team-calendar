import assert from 'node:assert/strict';
import test from 'node:test';
import { isSameOriginRequest } from './request';

function createRequest(headers: Record<string, string | undefined>) {
  return {
    headers: {
      get(name: string) {
        return headers[name.toLowerCase()] ?? null;
      }
    }
  } as any;
}

function restoreEnv(name: 'APP_BASE_URL' | 'NEXTAUTH_URL', previous: string | undefined) {
  if (previous === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = previous;
  }
}

test('isSameOriginRequest allows exact origin from APP_BASE_URL list', () => {
  const previous = process.env.APP_BASE_URL;
  process.env.APP_BASE_URL = 'https://app.example.com, https://preview.example.com';

  try {
    const request = createRequest({ origin: 'https://preview.example.com' });
    assert.equal(isSameOriginRequest(request), true);
  } finally {
    restoreEnv('APP_BASE_URL', previous);
  }
});

test('isSameOriginRequest allows host match for alternate scheme', () => {
  const previous = process.env.APP_BASE_URL;
  process.env.APP_BASE_URL = 'https://app.example.com';

  try {
    const request = createRequest({ referer: 'http://app.example.com/path?q=1' });
    assert.equal(isSameOriginRequest(request), true);
  } finally {
    restoreEnv('APP_BASE_URL', previous);
  }
});

test('isSameOriginRequest blocks unknown origin', () => {
  const previous = process.env.APP_BASE_URL;
  process.env.APP_BASE_URL = 'https://app.example.com, https://preview.example.com';

  try {
    const request = createRequest({ origin: 'https://evil.example.com' });
    assert.equal(isSameOriginRequest(request), false);
  } finally {
    restoreEnv('APP_BASE_URL', previous);
  }
});

test('isSameOriginRequest falls back to NEXTAUTH_URL when APP_BASE_URL is unset', () => {
  const previousAppBaseUrl = process.env.APP_BASE_URL;
  const previousNextAuthUrl = process.env.NEXTAUTH_URL;
  delete process.env.APP_BASE_URL;
  process.env.NEXTAUTH_URL = 'https://app.example.com';

  try {
    const request = createRequest({ origin: 'https://app.example.com' });
    assert.equal(isSameOriginRequest(request), true);
  } finally {
    restoreEnv('APP_BASE_URL', previousAppBaseUrl);
    restoreEnv('NEXTAUTH_URL', previousNextAuthUrl);
  }
});
