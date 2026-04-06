import assert from 'node:assert/strict';
import test from 'node:test';
import { createDbClient, resetDbClientCacheForTests, assertPostgresUrl } from './client';
import { buildEmbeddedPostgresUrl } from './runtime-defaults';

test('assertPostgresUrl accepts postgres schemes', () => {
  assert.doesNotThrow(() => assertPostgresUrl('postgres://localhost:5432/teamcal'));
  assert.doesNotThrow(() => assertPostgresUrl('postgresql://localhost:5432/teamcal'));
});

test('createDbClient uses postgres and caches client by DATABASE_URL', () => {
  const previousUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = buildEmbeddedPostgresUrl();

  try {
    resetDbClientCacheForTests();
    const first = createDbClient();
    const second = createDbClient();

    assert.equal(first.dialect, 'pg');
    assert.strictEqual(first, second);
  } finally {
    resetDbClientCacheForTests();
    if (previousUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousUrl;
    }
  }
});

test('createDbClient fails fast for unsupported DATABASE_URL', () => {
  const previousUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'mysql://localhost:3306/teamcal';

  try {
    resetDbClientCacheForTests();
    assert.throws(
      () => createDbClient(),
      /DATABASE_URL must start with postgres:\/\/ or postgresql:\/\//
    );
  } finally {
    resetDbClientCacheForTests();
    if (previousUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousUrl;
    }
  }
});
