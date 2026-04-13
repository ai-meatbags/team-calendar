import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  hasEmbeddedPostgresVersionFile,
  resetStaleEmbeddedPostgresDataDir
} from './embedded-postgres-data-dir';

test('hasEmbeddedPostgresVersionFile detects initialized cluster marker', () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'teamcal-pg-version-'));
  fs.writeFileSync(path.join(dataDir, 'PG_VERSION'), '18');

  assert.equal(hasEmbeddedPostgresVersionFile(dataDir), true);
});

test('resetStaleEmbeddedPostgresDataDir removes partial init contents but keeps mount dir', () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'teamcal-pg-reset-'));
  fs.writeFileSync(path.join(dataDir, 'postgresql.conf'), 'stale');
  fs.mkdirSync(path.join(dataDir, 'base'));
  fs.writeFileSync(path.join(dataDir, 'base', 'junk'), 'stale');

  resetStaleEmbeddedPostgresDataDir(dataDir);

  assert.deepEqual(fs.readdirSync(dataDir), []);
});
