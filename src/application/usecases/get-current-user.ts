import { and, eq } from 'drizzle-orm';
import type { DbClientProvider } from '@/ports/db';
import {
  badRequestError,
  internalError,
  unauthorizedError
} from '@/application/errors';
import {
  applyCalendarSelectionPatch,
  mergeCalendarSelection,
  parseCalendarSelectionStrict
} from '@/domain/calendar-selection/selection';

type DbClientFactory = () => DbClientProvider;

type CalendarListItem = {
  id?: string | null;
  summary?: string | null;
  primary?: boolean | null;
};

type FetchCalendarListParams = {
  refreshToken: string;
  clientId?: string;
  clientSecret?: string;
};

type CurrentUserDeps = {
  createDbClient: DbClientFactory;
  decryptRefreshToken?: (value: string | null | undefined) => string | null;
  fetchCalendarList?: (params: FetchCalendarListParams) => Promise<CalendarListItem[]>;
  googleClientId?: string;
  googleClientSecret?: string;
};

function getDbHandles(createDbClient: DbClientFactory) {
  const client = createDbClient();
  return {
    db: client.db as any,
    schema: client.schema as any
  };
}

async function findGoogleAccountByUserId(createDbClient: DbClientFactory, userId: string) {
  const { db, schema } = getDbHandles(createDbClient);
  const accounts = await db
    .select()
    .from(schema.accounts)
    .where(and(eq(schema.accounts.userId, userId), eq(schema.accounts.provider, 'google')))
    .limit(1);

  return accounts[0] || null;
}

async function getCalendarList(params: {
  createDbClient: DbClientFactory;
  decryptRefreshToken?: CurrentUserDeps['decryptRefreshToken'];
  fetchCalendarList?: CurrentUserDeps['fetchCalendarList'];
  googleClientId?: string;
  googleClientSecret?: string;
  userId: string;
}) {
  const decryptRefreshToken = params.decryptRefreshToken;
  const fetchCalendarList = params.fetchCalendarList;
  if (!decryptRefreshToken || !fetchCalendarList) {
    throw new Error('Calendar list dependencies are missing.');
  }

  const account = await findGoogleAccountByUserId(params.createDbClient, params.userId);
  const refreshToken = decryptRefreshToken(account?.refreshToken || null);
  if (!refreshToken) {
    throw badRequestError('Missing calendar credentials.', 'missing_calendar_credentials');
  }

  try {
    return await fetchCalendarList({
      refreshToken,
      clientId: params.googleClientId,
      clientSecret: params.googleClientSecret
    });
  } catch {
    throw internalError('Calendar sync failed.', 'calendar_sync_failed');
  }
}

export async function getCurrentUserByEmail(email: string, deps: CurrentUserDeps) {
  const { db, schema } = getDbHandles(deps.createDbClient);
  const users = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  return users[0] || null;
}

export async function getCurrentUserById(userId: string, deps: CurrentUserDeps) {
  const { db, schema } = getDbHandles(deps.createDbClient);
  const users = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  return users[0] || null;
}

export async function updateCurrentUserName(
  userId: string,
  name: string,
  deps: CurrentUserDeps
) {
  const normalizedName = String(name || '').trim();
  if (!normalizedName) {
    throw badRequestError('Missing user name.', 'missing_user_name');
  }

  const user = await getCurrentUserById(userId, deps);
  if (!user) {
    throw unauthorizedError();
  }

  const { db, schema } = getDbHandles(deps.createDbClient);
  await db
    .update(schema.users)
    .set({
      name: normalizedName,
      updatedAt: new Date().toISOString()
    })
    .where(eq(schema.users.id, userId));

  return {
    ...user,
    name: normalizedName
  };
}

export async function getCurrentUserCalendarSettings(userId: string, deps: CurrentUserDeps) {
  const user = await getCurrentUserById(userId, deps);
  if (!user) {
    throw unauthorizedError();
  }

  const calendarItems = await getCalendarList({
    createDbClient: deps.createDbClient,
    decryptRefreshToken: deps.decryptRefreshToken,
    fetchCalendarList: deps.fetchCalendarList,
    googleClientId: deps.googleClientId,
    googleClientSecret: deps.googleClientSecret,
    userId
  });

  const { selection, error } = parseCalendarSelectionStrict(user.calendarSelectionDefault);
  if (error) {
    throw internalError('Invalid calendar selection.', 'invalid_calendar_selection');
  }

  return {
    calendarSelectionDefault: mergeCalendarSelection(calendarItems, selection)
  };
}

export async function patchCurrentUserCalendarSettings(
  userId: string,
  patchSelection: unknown,
  deps: CurrentUserDeps
) {
  const user = await getCurrentUserById(userId, deps);
  if (!user) {
    throw unauthorizedError();
  }

  const calendarItems = await getCalendarList({
    createDbClient: deps.createDbClient,
    decryptRefreshToken: deps.decryptRefreshToken,
    fetchCalendarList: deps.fetchCalendarList,
    googleClientId: deps.googleClientId,
    googleClientSecret: deps.googleClientSecret,
    userId
  });

  const { selection, error } = parseCalendarSelectionStrict(user.calendarSelectionDefault);
  if (error) {
    throw internalError('Invalid calendar selection.', 'invalid_calendar_selection');
  }

  const patchedSelection = applyCalendarSelectionPatch(calendarItems, selection, patchSelection);
  if (patchedSelection.error) {
    if (patchedSelection.error.status === 400) {
      throw badRequestError('Invalid calendar selection payload.', 'invalid_calendar_selection_payload');
    }
    throw internalError('Invalid calendar selection.', 'invalid_calendar_selection');
  }

  const { db, schema } = getDbHandles(deps.createDbClient);
  await db
    .update(schema.users)
    .set({
      calendarSelectionDefault: JSON.stringify(patchedSelection.selection),
      updatedAt: new Date().toISOString()
    })
    .where(eq(schema.users.id, userId));

  return {
    calendarSelectionDefault: patchedSelection.selection
  };
}
