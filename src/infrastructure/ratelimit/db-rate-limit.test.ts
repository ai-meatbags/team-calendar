import assert from 'node:assert/strict';
import test from 'node:test';
import { createPgRouteFixture } from '../../../app/api/test-support/pg-route-fixture';
import { enforceDbRateLimit } from './db-rate-limit';

test('enforceDbRateLimit stores millisecond windows without integer overflow', async () => {
  const fixture = await createPgRouteFixture('teamcal-rate-limit');

  try {
    const first = await enforceDbRateLimit({
      keyPrefix: 'availability',
      fingerprint: 'test-fingerprint',
      max: 2,
      windowMs: 15 * 60 * 1000
    });

    const second = await enforceDbRateLimit({
      keyPrefix: 'availability',
      fingerprint: 'test-fingerprint',
      max: 2,
      windowMs: 15 * 60 * 1000
    });

    assert.deepEqual(first, { allowed: true, count: 1 });
    assert.deepEqual(second, { allowed: true, count: 2 });
  } finally {
    await fixture.cleanup();
  }
});
