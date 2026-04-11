import path from 'node:path';
import postgres from 'postgres';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

function resolveMigrationsFolder() {
  return path.resolve(process.cwd(), 'drizzle/migrations');
}

export function shouldRunRuntimeMigrations(command: string, args: string[]) {
  if (command !== 'next') {
    return false;
  }

  const subcommand = String(args[0] || '').trim();
  return subcommand === 'dev' || subcommand === 'start';
}

export async function applyRuntimeMigrations(databaseUrl: string) {
  const sql = postgres(databaseUrl, { prepare: false, max: 1 });
  const db = drizzlePg(sql);

  try {
    await migrate(db, {
      migrationsFolder: resolveMigrationsFolder()
    });
  } finally {
    await sql.end({ timeout: 1 });
  }
}
