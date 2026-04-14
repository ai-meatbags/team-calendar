import type { GoogleAuthRecoveryReason } from '@/application/errors';
import type { TokenVaultPort } from '@/ports/security';

type AccountLike = {
  refresh_token?: unknown;
  refreshToken?: unknown;
};

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

export function readRefreshToken(account: AccountLike | null | undefined) {
  if (!account) {
    return undefined;
  }

  if (isString(account.refresh_token)) {
    return account.refresh_token;
  }

  if (isString(account.refreshToken)) {
    return account.refreshToken;
  }

  return undefined;
}

export function resolveGoogleAccountState(params: {
  account: AccountLike | null | undefined;
  storedRefreshToken?: string | null;
  tokenVault: TokenVaultPort;
}) {
  const incomingRefreshToken = readRefreshToken(params.account);
  const hasIncomingRefreshToken = isString(incomingRefreshToken);
  let refreshToken = hasIncomingRefreshToken ? incomingRefreshToken : null;
  let reusedStoredRefreshToken = false;

  if (!refreshToken && isString(params.storedRefreshToken)) {
    refreshToken = params.storedRefreshToken;
    reusedStoredRefreshToken = true;
  }

  const encryptedRefreshToken = refreshToken
    ? params.tokenVault.isEncrypted(refreshToken)
      ? refreshToken
      : params.tokenVault.encrypt(refreshToken)
    : null;

  return {
    hasIncomingRefreshToken,
    reusedStoredRefreshToken,
    encryptedRefreshToken,
    authStatus: encryptedRefreshToken ? 'active' : ('reauth_required' as const),
    authStatusReason: encryptedRefreshToken ? null : ('missing_refresh_token' as GoogleAuthRecoveryReason)
  };
}
