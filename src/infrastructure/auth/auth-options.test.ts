import assert from 'node:assert/strict';
import test from 'node:test';
import { createGoogleAccountSignInHandler } from './auth-options';

function createTokenVaultMock() {
  return {
    encrypt: (value: string) => `enc:${value}`,
    decrypt: (value: string | null | undefined) => value || null,
    isEncrypted: (value: string | null | undefined) => Boolean(value && value.startsWith('enc:'))
  };
}

function createDbMock(existingAccounts: any[]) {
  const state = {
    updateSetPayload: null as Record<string, unknown> | null,
    selectWhereCalls: [] as unknown[],
    updateWhereCalls: [] as unknown[]
  };

  const db = {
    select() {
      return {
        from() {
          return {
            where(condition: unknown) {
              state.selectWhereCalls.push(condition);
              return {
                limit() {
                  return Promise.resolve(existingAccounts);
                }
              };
            }
          };
        }
      };
    },
    update() {
      return {
        set(payload: Record<string, unknown>) {
          state.updateSetPayload = payload;
          return {
            where(condition: unknown) {
              state.updateWhereCalls.push(condition);
              return Promise.resolve();
            }
          };
        }
      };
    }
  };

  return { db, state };
}

test('google sign-in reuses stored refresh token and resets recovery status', async () => {
  const { db, state } = createDbMock([
    {
      refreshToken: 'enc:stored-refresh-token'
    }
  ]);
  const handler = createGoogleAccountSignInHandler({
    dbClient: { db },
    tokenVault: createTokenVaultMock()
  });

  await handler({
    user: { id: 'user-1' },
    account: {
      provider: 'google',
      providerAccountId: 'google-account'
    }
  });

  assert.equal(state.selectWhereCalls.length, 1);
  assert.equal(state.updateWhereCalls.length, 1);
  assert.equal(state.updateSetPayload?.refreshToken, 'enc:stored-refresh-token');
  assert.equal(state.updateSetPayload?.authStatus, 'active');
  assert.equal(state.updateSetPayload?.authStatusReason, null);
  assert.equal(typeof state.updateSetPayload?.authStatusUpdatedAt, 'string');
});

test('google sign-in keeps reauth_required when no refresh token exists anywhere', async () => {
  const { db, state } = createDbMock([]);
  const handler = createGoogleAccountSignInHandler({
    dbClient: { db },
    tokenVault: createTokenVaultMock()
  });

  await handler({
    user: { id: 'user-1' },
    account: {
      provider: 'google',
      providerAccountId: 'google-account'
    }
  });

  assert.equal(state.updateSetPayload?.refreshToken, null);
  assert.equal(state.updateSetPayload?.authStatus, 'reauth_required');
  assert.equal(state.updateSetPayload?.authStatusReason, 'missing_refresh_token');
  assert.equal(typeof state.updateSetPayload?.authStatusUpdatedAt, 'string');
});
