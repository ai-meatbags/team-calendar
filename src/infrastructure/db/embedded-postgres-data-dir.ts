import fs from 'node:fs';
import path from 'node:path';

export function hasEmbeddedPostgresVersionFile(dataDir: string) {
  return fs.existsSync(path.join(dataDir, 'PG_VERSION'));
}

export function resetStaleEmbeddedPostgresDataDir(dataDir: string) {
  if (!fs.existsSync(dataDir)) {
    return;
  }

  for (const entry of fs.readdirSync(dataDir)) {
    fs.rmSync(path.join(dataDir, entry), { recursive: true, force: true });
  }
}
