import { DrizzleAdapter } from '@auth/drizzle-adapter';
import type { Adapter } from 'next-auth/adapters';
import type { TokenVaultPort } from '@/ports/security';
import { logger } from '@/infrastructure/logging/logger';

type AdapterFactory = (db: unknown, schema: unknown) => Adapter;
type AuthAccountInput = Record<string, any>;

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function nowIso() {
  return new Date().toISOString();
}

function pickFirstDefined<T>(...values: Array<T | undefined>): T | undefined {
  for (const value of values) {
    if (value !== undefined) {
      return value;
    }
  }
  return undefined;
}

function readRefreshToken(account: AuthAccountInput) {
  return pickFirstDefined(account.refresh_token, account.refreshToken);
}

function mapAccountForSchema(account: AuthAccountInput, encryptedRefreshToken: string | null) {
  return {
    userId: account.userId,
    type: account.type,
    provider: account.provider,
    providerAccountId: account.providerAccountId,
    refreshToken: encryptedRefreshToken,
    accessToken: pickFirstDefined(account.access_token, account.accessToken),
    expiresAt: pickFirstDefined(account.expires_at, account.expiresAt),
    tokenType: pickFirstDefined(account.token_type, account.tokenType),
    scope: account.scope,
    idToken: pickFirstDefined(account.id_token, account.idToken),
    sessionState: pickFirstDefined(account.session_state, account.sessionState)
  };
}

export function createEncryptedDrizzleAdapter(
  db: unknown,
  schema: unknown,
  tokenVault: TokenVaultPort,
  createBaseAdapter: AdapterFactory = (dbClient, schemaConfig) =>
    DrizzleAdapter(dbClient as any, schemaConfig as any) as Adapter
): Adapter {
  const base = createBaseAdapter(db, schema);

  const originalCreateUser = base.createUser?.bind(base);
  const originalUpdateUser = base.updateUser?.bind(base);
  const originalLinkAccount = base.linkAccount?.bind(base);

  const patched = {
    ...base,
    async createUser(user: any): Promise<any> {
      if (!originalCreateUser) {
        throw new Error('Adapter does not implement createUser');
      }

      const timestamp = nowIso();
      return originalCreateUser({
        ...user,
        createdAt: user?.createdAt || timestamp,
        updatedAt: user?.updatedAt || timestamp
      });
    },
    async updateUser(user: any): Promise<any> {
      if (!originalUpdateUser) {
        throw new Error('Adapter does not implement updateUser');
      }

      return originalUpdateUser({
        ...user,
        updatedAt: nowIso()
      });
    },
    async linkAccount(account: any): Promise<any> {
      if (!originalLinkAccount) {
        throw new Error('Adapter does not implement linkAccount');
      }

      const incomingRefreshToken = readRefreshToken(account);
      const hasIncomingRefreshToken = isString(incomingRefreshToken);
      let refreshToken = hasIncomingRefreshToken ? incomingRefreshToken : null;
      let reusedStoredRefreshToken = false;

      if (!refreshToken && typeof base.getAccount === 'function') {
        const existing = await base.getAccount(account.providerAccountId, account.provider);
        const existingRefreshToken =
          existing && typeof existing === 'object' ? readRefreshToken(existing as AuthAccountInput) : undefined;
        if (isString(existingRefreshToken)) {
          refreshToken = existingRefreshToken;
          reusedStoredRefreshToken = true;
        }
      }

      const encryptedRefreshToken = refreshToken
        ? tokenVault.isEncrypted(refreshToken)
          ? refreshToken
          : tokenVault.encrypt(refreshToken)
        : null;

      logger.info('Auth linkAccount token state', {
        provider: account.provider,
        userId: account.userId || null,
        hasIncomingRefreshToken,
        reusedStoredRefreshToken,
        willPersistRefreshToken: Boolean(encryptedRefreshToken)
      });

      const linkedAccount = await originalLinkAccount({
        ...mapAccountForSchema(account, encryptedRefreshToken)
      });

      if (!encryptedRefreshToken) {
        logger.warn('Auth linkAccount completed without refresh token', {
          provider: account.provider,
          userId: account.userId || null
        });
      }

      return linkedAccount;
    }
  } as Adapter;

  return patched;
}
