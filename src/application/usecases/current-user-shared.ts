import { and, eq } from 'drizzle-orm';
import type { DbClientProvider } from '@/ports/db';
import {
  currentUserRecoveryRequiredError,
  type GoogleAuthRecoveryReason,
  internalError,
  isGoogleReauthRequiredError,
  isGoogleTransientFailureError
} from '@/application/errors';

export type DbClientFactory = () => DbClientProvider;

export type CalendarListItem = {
  id?: string | null;
  summary?: string | null;
  primary?: boolean | null;
};

export type FetchCalendarListParams = {
  refreshToken: string;
  clientId?: string;
  clientSecret?: string;
};

export type CurrentUserDeps = {
  createDbClient: DbClientFactory;
  decryptRefreshToken?: (value: string | null | undefined) => string | null;
  fetchCalendarList?: (params: FetchCalendarListParams) => Promise<CalendarListItem[]>;
  googleClientId?: string;
  googleClientSecret?: string;
};

export function getDbHandles(createDbClient: DbClientFactory) {
  const client = createDbClient();
  return {
    db: client.db as any,
    schema: client.schema as any
  };
}

export async function findGoogleAccountByUserId(createDbClient: DbClientFactory, userId: string) {
  const { db, schema } = getDbHandles(createDbClient);
  const accounts = await db
    .select()
    .from(schema.accounts)
    .where(and(eq(schema.accounts.userId, userId), eq(schema.accounts.provider, 'google')))
    .limit(1);

  return accounts[0] || null;
}

export async function markCurrentUserAccountForRecovery(
  createDbClient: DbClientFactory,
  userId: string,
  sessionToken: string | null | undefined,
  reason: GoogleAuthRecoveryReason
): Promise<never> {
  const { db, schema } = getDbHandles(createDbClient);
  const nowIso = new Date().toISOString();

  await db
    .update(schema.accounts)
    .set({
      authStatus: 'reauth_required',
      authStatusUpdatedAt: nowIso,
      authStatusReason: reason
    })
    .where(and(eq(schema.accounts.userId, userId), eq(schema.accounts.provider, 'google')));

  if (sessionToken) {
    await db.delete(schema.sessions).where(eq(schema.sessions.sessionToken, sessionToken));
  }

  throw currentUserRecoveryRequiredError(reason);
}

function normalizeRecoveryReason(value: unknown): GoogleAuthRecoveryReason {
  if (value === 'oauth_revoked' || value === 'scope_lost') {
    return value;
  }

  return 'missing_refresh_token';
}

export async function enforceCurrentUserAccountRecoveryIfNeeded(
  createDbClient: DbClientFactory,
  userId: string,
  sessionToken?: string | null
) {
  const account = await findGoogleAccountByUserId(createDbClient, userId);
  if (!account) {
    return;
  }

  if (account.authStatus !== 'reauth_required') {
    return;
  }

  await markCurrentUserAccountForRecovery(
    createDbClient,
    userId,
    sessionToken,
    normalizeRecoveryReason(account.authStatusReason)
  );
}

export async function getCalendarList(params: {
  createDbClient: DbClientFactory;
  decryptRefreshToken?: CurrentUserDeps['decryptRefreshToken'];
  fetchCalendarList?: CurrentUserDeps['fetchCalendarList'];
  googleClientId?: string;
  googleClientSecret?: string;
  userId: string;
  sessionToken?: string | null;
}) {
  const decryptRefreshToken = params.decryptRefreshToken;
  const fetchCalendarList = params.fetchCalendarList;
  if (!decryptRefreshToken || !fetchCalendarList) {
    throw new Error('Calendar list dependencies are missing.');
  }

  const account = await findGoogleAccountByUserId(params.createDbClient, params.userId);
  const decryptedRefreshToken = decryptRefreshToken(account?.refreshToken || null);
  if (!decryptedRefreshToken) {
    await markCurrentUserAccountForRecovery(
      params.createDbClient,
      params.userId,
      params.sessionToken,
      'missing_refresh_token'
    );
    throw new Error('Recovery flow must throw');
  }
  const refreshToken = decryptedRefreshToken;

  try {
    return await fetchCalendarList({
      refreshToken,
      clientId: params.googleClientId,
      clientSecret: params.googleClientSecret
    });
  } catch (error) {
    if (isGoogleReauthRequiredError(error)) {
      await markCurrentUserAccountForRecovery(
        params.createDbClient,
        params.userId,
        params.sessionToken,
        error.reason
      );
    }

    if (isGoogleTransientFailureError(error)) {
      throw internalError('Google Calendar is temporarily unavailable.', 'calendar_temporarily_unavailable');
    }

    throw internalError('Calendar sync failed.', 'calendar_sync_failed');
  }
}
