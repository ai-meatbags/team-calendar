import 'dotenv/config';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import EmbeddedPostgres from 'embedded-postgres';
import postgres from 'postgres';
import {
  buildEmbeddedPostgresUrl,
  resolveEmbeddedPostgresConfig
} from '../src/infrastructure/db/runtime-defaults';
import { findAvailablePort, rewriteLocalAppUrls } from '../src/infrastructure/runtime/port-resolution';

function quoteIdentifier(value: string) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function resolveLocalUrlPort(rawValue: string | undefined) {
  if (!rawValue) {
    return null;
  }

  try {
    const url = new URL(rawValue.trim());
    if (!LOCAL_HOSTS.has(url.hostname) || !url.port) {
      return null;
    }

    const port = Number.parseInt(url.port, 10);
    return Number.isInteger(port) && port > 0 ? port : null;
  } catch {
    return null;
  }
}

function resolvePreferredAppPort(env: NodeJS.ProcessEnv) {
  const appBaseUrls = env.APP_BASE_URL?.split(',').map((value) => value.trim()) ?? [];
  const candidates = [
    env.NEXTAUTH_URL,
    env.GOOGLE_REDIRECT_URI,
    ...appBaseUrls
  ];

  for (const candidate of candidates) {
    const resolvedPort = resolveLocalUrlPort(candidate);
    if (resolvedPort) {
      return resolvedPort;
    }
  }

  return Number.parseInt(env.PORT || '3000', 10);
}

async function ensureDatabase(sql: postgres.Sql, databaseName: string) {
  const existing = await sql<{ exists: boolean }[]>`
    SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = ${databaseName}) AS exists
  `;

  if (!existing[0]?.exists) {
    await sql.unsafe(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
  }
}

async function startEmbeddedPostgres() {
  const config = resolveEmbeddedPostgresConfig();
  const preferredPort = config.port;
  config.port = await findAvailablePort(config.port, config.host);
  if (config.port !== preferredPort) {
    console.warn(
      `[dev] Embedded Postgres port ${preferredPort} is busy, using ${config.port}`
    );
  }

  const url = buildEmbeddedPostgresUrl(config);
  const instance = new EmbeddedPostgres({
    databaseDir: config.dataDir,
    user: config.user,
    password: config.password,
    port: config.port,
    persistent: true,
    createPostgresUser: config.createUser,
    postgresFlags: ['-c', `listen_addresses=${config.host}`]
  });

  const versionFile = `${config.dataDir}/PG_VERSION`;
  if (!fs.existsSync(versionFile)) {
    try {
      await instance.initialise();
    } catch (error) {
      if (!fs.existsSync(versionFile)) {
        throw error;
      }
    }
  }

  await instance.start();

  const adminUrl = new URL(url);
  adminUrl.pathname = '/postgres';
  const sql = postgres(adminUrl.toString(), { max: 1 });
  try {
    await ensureDatabase(sql, config.database);
  } finally {
    await sql.end({ timeout: 1 });
  }

  return {
    instance,
    databaseUrl: url
  };
}

async function spawnCommand(command: string, args: string[], env: NodeJS.ProcessEnv) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    env
  });

  return await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve) => {
    child.on('exit', (code, signal) => resolve({ code, signal }));
  });
}

async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  if (!command) {
    throw new Error('with-default-postgres requires a command to execute.');
  }

  let childEnv = { ...process.env };
  const nextSubcommand = command === 'next' ? args[0] : null;

  if (nextSubcommand === 'dev') {
    const preferredPort = Number.parseInt(process.env.PORT || '3000', 10);
    const resolvedPort = await findAvailablePort(preferredPort);
    childEnv.PORT = String(resolvedPort);
    childEnv.NODE_ENV = 'development';
    childEnv = rewriteLocalAppUrls(childEnv, preferredPort, resolvedPort);
    if (resolvedPort !== preferredPort) {
      console.warn(`[dev] App port ${preferredPort} is busy, using ${resolvedPort}`);
    }
  }

  if (nextSubcommand === 'build' || nextSubcommand === 'start') {
    childEnv.NODE_ENV = 'production';
  }

  if (nextSubcommand === 'start') {
    const targetPort = Number.parseInt(process.env.PORT || '3000', 10);
    const preferredPort = resolvePreferredAppPort(childEnv);
    childEnv.PORT = String(targetPort);
    childEnv = rewriteLocalAppUrls(childEnv, preferredPort, targetPort);
  }

  if (process.env.DATABASE_URL) {
    const result = await spawnCommand(command, args, childEnv);
    if (result.signal) {
      process.kill(process.pid, result.signal);
      return;
    }
    process.exit(result.code ?? 0);
  }

  const { instance, databaseUrl } = await startEmbeddedPostgres();
  try {
    const result = await spawnCommand(command, args, {
      ...childEnv,
      DATABASE_URL: databaseUrl
    });
    if (result.signal) {
      process.kill(process.pid, result.signal);
      return;
    }
    process.exit(result.code ?? 0);
  } finally {
    await instance.stop().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
