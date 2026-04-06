import path from 'node:path';

export type EmbeddedPostgresConfig = {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  dataDir: string;
  createUser: boolean;
};

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 54329;
const DEFAULT_DATABASE = 'teamcal';
const DEFAULT_USER = 'postgres';
const DEFAULT_PASSWORD = 'postgres';

function resolveDataDir() {
  const raw = process.env.EMBEDDED_POSTGRES_DATA_DIR || './data/postgres';
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
}

function parsePort(value: string | undefined) {
  const normalized = Number(value || DEFAULT_PORT);
  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw new Error('EMBEDDED_POSTGRES_PORT must be a positive integer.');
  }
  return normalized;
}

export function resolveEmbeddedPostgresConfig(): EmbeddedPostgresConfig {
  return {
    host: process.env.EMBEDDED_POSTGRES_HOST || DEFAULT_HOST,
    port: parsePort(process.env.EMBEDDED_POSTGRES_PORT),
    database: process.env.EMBEDDED_POSTGRES_DB || DEFAULT_DATABASE,
    user: process.env.EMBEDDED_POSTGRES_USER || DEFAULT_USER,
    password: process.env.EMBEDDED_POSTGRES_PASSWORD || DEFAULT_PASSWORD,
    dataDir: resolveDataDir(),
    createUser: process.env.EMBEDDED_POSTGRES_CREATE_USER === 'true'
  };
}

export function buildEmbeddedPostgresUrl(config = resolveEmbeddedPostgresConfig()) {
  const url = new URL('postgres://localhost');
  url.protocol = 'postgres:';
  url.hostname = config.host;
  url.port = String(config.port);
  url.username = config.user;
  url.password = config.password;
  url.pathname = `/${config.database}`;
  return url.toString();
}

export function resolveRuntimeDatabaseUrl() {
  return process.env.DATABASE_URL || buildEmbeddedPostgresUrl();
}
