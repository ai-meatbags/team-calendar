import { randomUUID } from 'node:crypto';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import type { Adapter } from 'next-auth/adapters';
import type { TokenVaultPort } from '@/ports/security';
import { buildDefaultSlotRuleSettingsInsert } from '@/application/usecases/slot-rules-settings';
import { logger } from '@/infrastructure/logging/logger';
import { readRefreshToken, resolveGoogleAccountState } from './google-account-state';

type AdapterFactory = (db: unknown, schema: unknown) => Adapter;
type AuthAccountInput = Record<string, any>;

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
    sessionState: pickFirstDefined(account.session_state, account.sessionState),
    authStatus: pickFirstDefined(account.auth_status, account.authStatus) ?? 'active',
    authStatusUpdatedAt: pickFirstDefined(account.auth_status_updated_at, account.authStatusUpdatedAt),
    authStatusReason: pickFirstDefined(account.auth_status_reason, account.authStatusReason)
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
      const createdUser = await originalCreateUser({
        ...user,
        createdAt: user?.createdAt || timestamp,
        updatedAt: user?.updatedAt || timestamp
      });

      const slotRuleSettingsTable = (schema as any).userSlotRuleSettings;
      if (slotRuleSettingsTable && createdUser?.id) {
        await (db as any).insert(slotRuleSettingsTable).values(
          buildDefaultSlotRuleSettingsInsert({
            id: randomUUID(),
            userId: String(createdUser.id),
            createdAt: timestamp
          })
        );
      }

      return createdUser;
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
      const timestamp = nowIso();
      let storedRefreshToken: string | null = null;

      if (typeof base.getAccount === 'function') {
        const existing = await base.getAccount(account.providerAccountId, account.provider);
        storedRefreshToken =
          existing && typeof existing === 'object' ? readRefreshToken(existing as AuthAccountInput) || null : null;
      }
      const {
        hasIncomingRefreshToken,
        reusedStoredRefreshToken,
        encryptedRefreshToken,
        authStatus,
        authStatusReason
      } = resolveGoogleAccountState({
        account,
        storedRefreshToken,
        tokenVault
      });

      logger.info('Auth linkAccount token state', {
        provider: account.provider,
        userId: account.userId || null,
        hasIncomingRefreshToken,
        reusedStoredRefreshToken,
        willPersistRefreshToken: Boolean(encryptedRefreshToken)
      });

      const linkedAccount = await originalLinkAccount({
        ...mapAccountForSchema(account, encryptedRefreshToken),
        authStatus,
        authStatusUpdatedAt: timestamp,
        authStatusReason
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
