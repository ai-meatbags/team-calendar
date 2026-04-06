import postgres from 'postgres';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import type { DbClientProvider } from '@/ports/db';
import { schema } from './schema';
import { resolveRuntimeDatabaseUrl } from './runtime-defaults';

const POSTGRES_PREFIXES = ['postgres://', 'postgresql://'];
let cachedClient: { url: string; client: DbClientProvider } | null = null;

function resolveDatabaseUrl(databaseUrl?: string) {
  return databaseUrl || resolveRuntimeDatabaseUrl();
}

export function assertPostgresUrl(databaseUrl: string) {
  if (!POSTGRES_PREFIXES.some((prefix) => databaseUrl.startsWith(prefix))) {
    throw new Error('DATABASE_URL must start with postgres:// or postgresql://');
  }
}

export function resetDbClientCacheForTests() {
  cachedClient = null;
}

export function createDbClient(databaseUrl?: string): DbClientProvider {
  const resolvedDatabaseUrl = resolveDatabaseUrl(databaseUrl);
  assertPostgresUrl(resolvedDatabaseUrl);

  if (cachedClient && cachedClient.url === resolvedDatabaseUrl) {
    return cachedClient.client;
  }

  const sql = postgres(resolvedDatabaseUrl, { prepare: false });
  const db = drizzlePg(sql, { schema });
  const client: DbClientProvider = {
    dialect: 'pg',
    db,
    schema,
    transaction: async (fn) => db.transaction(async (tx) => fn(tx))
  };
  cachedClient = { url: resolvedDatabaseUrl, client };
  return client;
}
