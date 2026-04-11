import assert from 'node:assert/strict';
import test from 'node:test';
import type { Adapter } from 'next-auth/adapters';
import { createEncryptedDrizzleAdapter } from './encrypted-drizzle-adapter';

function createTokenVaultMock() {
  return {
    encrypt: (value: string) => `enc:${value}`,
    decrypt: (value: string | null | undefined) => value || null,
    isEncrypted: (value: string | null | undefined) => Boolean(value && value.startsWith('enc:'))
  };
}

test('linkAccount encrypts plaintext refresh_token', async () => {
  const linkedAccounts: any[] = [];
  const baseAdapter: Adapter = {
    async linkAccount(account) {
      linkedAccounts.push(account);
      return account as any;
    }
  };
  const tokenVault = createTokenVaultMock();
  const adapter = createEncryptedDrizzleAdapter(
    {},
    {},
    tokenVault,
    () => baseAdapter
  );

  const result = await adapter.linkAccount?.({
    provider: 'google',
    providerAccountId: 'google-account',
    userId: 'user-1',
    type: 'oauth',
    refresh_token: 'plain-refresh-token'
  } as any);

  assert.equal(linkedAccounts.length, 1);
  assert.equal(linkedAccounts[0].refreshToken, 'enc:plain-refresh-token');
  assert.equal(linkedAccounts[0].accessToken, undefined);
  assert.equal((result as any).refreshToken, 'enc:plain-refresh-token');
});

test('createUser adds createdAt and updatedAt for auth schema', async () => {
  const createdUsers: any[] = [];
  const baseAdapter: Adapter = {
    async createUser(user) {
      createdUsers.push(user);
      return user as any;
    }
  };
  const tokenVault = createTokenVaultMock();
  const adapter = createEncryptedDrizzleAdapter({}, {}, tokenVault, () => baseAdapter);

  const result = await adapter.createUser?.({
    id: 'user-1',
    email: 'user@example.com',
    name: 'User'
  } as any);

  assert.equal(createdUsers.length, 1);
  assert.equal(typeof createdUsers[0].createdAt, 'string');
  assert.equal(typeof createdUsers[0].updatedAt, 'string');
  assert.equal(createdUsers[0].createdAt, createdUsers[0].updatedAt);
  assert.equal((result as any).createdAt, createdUsers[0].createdAt);
});

test('createUser provisions slot rule defaults row when slot rules table is available', async () => {
  const insertedRows: any[] = [];
  const baseAdapter: Adapter = {
    async createUser(user) {
      return {
        ...user,
        id: 'user-1'
      } as any;
    }
  };
  const dbMock = {
    insert() {
      return {
        values(value: unknown) {
          insertedRows.push(value);
          return Promise.resolve();
        }
      };
    }
  };
  const adapter = createEncryptedDrizzleAdapter(
    dbMock,
    {
      userSlotRuleSettings: {}
    },
    createTokenVaultMock(),
    () => baseAdapter
  );

  await adapter.createUser?.({
    email: 'user@example.com',
    name: 'User'
  } as any);

  assert.equal(insertedRows.length, 1);
  assert.equal(insertedRows[0].userId, 'user-1');
  assert.equal(insertedRows[0].days, 14);
  assert.equal(insertedRows[0].workdayStartHour, 10);
  assert.equal(insertedRows[0].workdayEndHour, 20);
  assert.equal(insertedRows[0].minNoticeHours, 12);
});

test('updateUser refreshes updatedAt for auth schema', async () => {
  const updatedUsers: any[] = [];
  const baseAdapter: Adapter = {
    async updateUser(user) {
      updatedUsers.push(user);
      return user as any;
    }
  };
  const tokenVault = createTokenVaultMock();
  const adapter = createEncryptedDrizzleAdapter({}, {}, tokenVault, () => baseAdapter);

  await adapter.updateUser?.({
    id: 'user-1',
    name: 'Updated User',
    updatedAt: '2020-01-01T00:00:00.000Z'
  } as any);

  assert.equal(updatedUsers.length, 1);
  assert.equal(updatedUsers[0].id, 'user-1');
  assert.equal(updatedUsers[0].name, 'Updated User');
  assert.notEqual(updatedUsers[0].updatedAt, '2020-01-01T00:00:00.000Z');
  assert.equal(typeof updatedUsers[0].updatedAt, 'string');
});

test('linkAccount preserves previous encrypted refresh_token when update payload has no token', async () => {
  const linkedAccounts: any[] = [];
  const baseAdapter: Adapter = {
    async getAccount() {
      return {
        provider: 'google',
        providerAccountId: 'google-account',
        userId: 'user-1',
        type: 'oauth',
        refreshToken: 'enc:stored-token'
      } as any;
    },
    async linkAccount(account) {
      linkedAccounts.push(account);
      return account as any;
    }
  };
  const tokenVault = createTokenVaultMock();
  const adapter = createEncryptedDrizzleAdapter(
    {},
    {},
    tokenVault,
    () => baseAdapter
  );

  await adapter.linkAccount?.({
    provider: 'google',
    providerAccountId: 'google-account',
    userId: 'user-1',
    type: 'oauth'
  } as any);

  assert.equal(linkedAccounts.length, 1);
  assert.equal(linkedAccounts[0].refreshToken, 'enc:stored-token');
});

test('linkAccount does not re-encrypt already encrypted refresh_token', async () => {
  let encryptCalls = 0;
  const baseAdapter: Adapter = {
    async linkAccount(account) {
      return account as any;
    }
  };
  const adapter = createEncryptedDrizzleAdapter(
    {},
    {},
    {
      encrypt: (value: string) => {
        encryptCalls += 1;
        return `enc:${value}`;
      },
      decrypt: (value: string | null | undefined) => value || null,
      isEncrypted: (value: string | null | undefined) => Boolean(value && value.startsWith('enc:'))
    },
    () => baseAdapter
  );

  const result = await adapter.linkAccount?.({
    provider: 'google',
    providerAccountId: 'google-account',
    userId: 'user-1',
    type: 'oauth',
    refresh_token: 'enc:existing-token'
  } as any);

  assert.equal(encryptCalls, 0);
  assert.equal((result as any).refreshToken, 'enc:existing-token');
});

test('linkAccount maps Auth.js snake_case account fields to schema camelCase fields', async () => {
  const linkedAccounts: any[] = [];
  const baseAdapter: Adapter = {
    async linkAccount(account) {
      linkedAccounts.push(account);
      return account as any;
    }
  };
  const adapter = createEncryptedDrizzleAdapter(
    {},
    {},
    createTokenVaultMock(),
    () => baseAdapter
  );

  await adapter.linkAccount?.({
    userId: 'user-1',
    type: 'oidc',
    provider: 'google',
    providerAccountId: 'google-account',
    refresh_token: 'plain-refresh-token',
    access_token: 'plain-access-token',
    expires_at: 1234567890,
    token_type: 'Bearer',
    scope: 'openid email profile',
    id_token: 'plain-id-token',
    session_state: 'state-1'
  } as any);

  assert.equal(linkedAccounts.length, 1);
  assert.deepEqual(linkedAccounts[0], {
    userId: 'user-1',
    type: 'oidc',
    provider: 'google',
    providerAccountId: 'google-account',
    refreshToken: 'enc:plain-refresh-token',
    accessToken: 'plain-access-token',
    expiresAt: 1234567890,
    tokenType: 'Bearer',
    scope: 'openid email profile',
    idToken: 'plain-id-token',
    sessionState: 'state-1',
    authStatus: 'active',
    authStatusUpdatedAt: undefined,
    authStatusReason: undefined
  });
});
