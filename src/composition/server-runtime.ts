import type { DbClientProvider } from '@/ports/db';
import type { TokenVaultPort } from '@/ports/security';
import { createDbClient } from '@/infrastructure/db/client';
import { createTokenVault } from '@/infrastructure/crypto/token-vault';
import { logger } from '@/infrastructure/logging/logger';
import { getEnv, type AppEnv } from './env';

export type ServerRuntime = {
  env: AppEnv;
  logger: typeof logger;
  dbClient: DbClientProvider;
  tokenVault: TokenVaultPort;
  now: () => Date;
};

let cachedRuntime: ServerRuntime | null = null;

export function createServerRuntime(): ServerRuntime {
  const env = getEnv();

  return {
    env,
    logger,
    dbClient: createDbClient(env.DATABASE_URL),
    tokenVault: createTokenVault(env.TOKEN_ENC_KEY),
    now: () => new Date()
  };
}

export function getServerRuntime(): ServerRuntime {
  if (!cachedRuntime) {
    cachedRuntime = createServerRuntime();
  }

  return cachedRuntime;
}
