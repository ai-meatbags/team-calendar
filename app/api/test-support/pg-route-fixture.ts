import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { resetDbClientCacheForTests } from '@/infrastructure/db/client';
import { buildEmbeddedPostgresUrl } from '@/infrastructure/db/runtime-defaults';

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    image TEXT,
    calendar_selection_default TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    share_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    privacy TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    member_public_id TEXT NOT NULL,
    calendar_selection TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS team_webhook_subscriptions (
    id TEXT PRIMARY KEY,
    team_id_raw TEXT NOT NULL,
    event_type TEXT NOT NULL,
    target_url TEXT NOT NULL,
    status TEXT NOT NULL,
    created_by_user_id_raw TEXT NOT NULL,
    updated_by_user_id_raw TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_delivery_status TEXT NOT NULL,
    last_delivery_at TEXT,
    last_error TEXT
  );
  CREATE TABLE IF NOT EXISTS accounts (
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT
  );
  CREATE TABLE IF NOT EXISTS sessions (
    session_token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires TIMESTAMPTZ NOT NULL
  );
  CREATE TABLE IF NOT EXISTS verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (identifier, token)
  );
  CREATE TABLE IF NOT EXISTS rate_limit_counters (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL,
    window_start_ms BIGINT NOT NULL,
    count INTEGER NOT NULL,
    expires_at_ms BIGINT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS rate_limit_key_window_uq
  ON rate_limit_counters (key, window_start_ms);
  CREATE UNIQUE INDEX IF NOT EXISTS team_webhook_subscription_target_uq
  ON team_webhook_subscriptions (team_id_raw, event_type, target_url);
`;

type QueryCompat = {
  run: (...params: unknown[]) => Promise<void>;
  get: <T>(...params: unknown[]) => Promise<T | undefined>;
  all: <T>(...params: unknown[]) => Promise<T[]>;
};

export type PgTestDatabase = {
  prepare: (statement: string) => QueryCompat;
};

function quoteIdentifier(value: string) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function toSqlLiteral(value: unknown): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }

  if (value instanceof Date) {
    return `'${value.toISOString().replace(/'/g, "''")}'`;
  }

  return `'${String(value).replace(/'/g, "''")}'`;
}

function compileStatement(statement: string, params: unknown[]) {
  let index = 0;
  return statement.replace(/\?/g, () => {
    const value = params[index];
    index += 1;
    return toSqlLiteral(value);
  });
}

async function execStatements(sql: postgres.Sql, source: string) {
  const statements = source
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await sql.unsafe(statement);
  }
}

function createCompatDb(sql: postgres.Sql): PgTestDatabase {
  return {
    prepare(statement: string) {
      return {
        run: async (...params: unknown[]) => {
          await sql.unsafe(compileStatement(statement, params));
        },
        get: async <T>(...params: unknown[]) => {
          const rows = await sql.unsafe<T[]>(compileStatement(statement, params));
          return rows[0];
        },
        all: async <T>(...params: unknown[]) => {
          return await sql.unsafe<T[]>(compileStatement(statement, params));
        }
      };
    }
  };
}

function buildAdminUrl(databaseUrl: string) {
  const url = new URL(databaseUrl);
  url.pathname = '/postgres';
  return url.toString();
}

export async function createPgRouteFixture(prefix: string) {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  const baseDatabaseUrl = previousDatabaseUrl || buildEmbeddedPostgresUrl();
  const adminUrl = buildAdminUrl(baseDatabaseUrl);
  const dbName = `${prefix.replace(/[^a-z0-9]+/gi, '_').slice(0, 24)}_${randomUUID().replace(/-/g, '')}`;
  const testUrl = new URL(baseDatabaseUrl);
  testUrl.pathname = `/${dbName}`;

  const admin = postgres(adminUrl, { max: 1 });
  await admin.unsafe(`CREATE DATABASE ${quoteIdentifier(dbName)}`);

  process.env.DATABASE_URL = testUrl.toString();
  resetDbClientCacheForTests();

  const dbSql = postgres(testUrl.toString(), { max: 1 });
  await execStatements(dbSql, SCHEMA_SQL);

  return {
    db: createCompatDb(dbSql),
    async cleanup() {
      await dbSql.end({ timeout: 1 });
      if (previousDatabaseUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = previousDatabaseUrl;
      }
      resetDbClientCacheForTests();

      await admin`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = ${dbName} AND pid <> pg_backend_pid()
      `;
      await admin.unsafe(`DROP DATABASE IF EXISTS ${quoteIdentifier(dbName)}`);
      await admin.end({ timeout: 1 });
    }
  };
}
