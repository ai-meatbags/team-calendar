import { and, eq } from 'drizzle-orm';
import type { DbClientProvider } from '@/ports/db';
import { badRequestError, internalError } from '@/application/errors';

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

export type TeamPageDeps = {
  createDbClient: DbClientFactory;
  decryptRefreshToken: (value: string | null | undefined) => string | null;
  fetchCalendarList: (params: FetchCalendarListParams) => Promise<CalendarListItem[]>;
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

export async function findTeamByShareId(createDbClient: DbClientFactory, shareId: string) {
  const { db, schema } = getDbHandles(createDbClient);
  const teams = await db.select().from(schema.teams).where(eq(schema.teams.shareId, shareId)).limit(1);
  return teams[0] || null;
}

export async function findMemberByTeamAndUser(
  createDbClient: DbClientFactory,
  teamId: string,
  userId: string
) {
  const { db, schema } = getDbHandles(createDbClient);
  const members = await db
    .select()
    .from(schema.teamMembers)
    .where(and(eq(schema.teamMembers.teamId, teamId), eq(schema.teamMembers.userId, userId)))
    .limit(1);
  return members[0] || null;
}

export async function findUserById(createDbClient: DbClientFactory, userId: string) {
  const { db, schema } = getDbHandles(createDbClient);
  const users = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  return users[0] || null;
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

export async function listTeamMembersWithUsers(createDbClient: DbClientFactory, teamId: string) {
  const { db, schema } = getDbHandles(createDbClient);
  const members = await db.select().from(schema.teamMembers).where(eq(schema.teamMembers.teamId, teamId));
  const rows = await Promise.all(
    members.map(async (member: any) => {
      const users = await db.select().from(schema.users).where(eq(schema.users.id, member.userId)).limit(1);
      const user = users[0] || null;
      if (!user) {
        return null;
      }
      return { member, user };
    })
  );
  return rows.filter(Boolean);
}

export async function getCalendarListForUser(params: {
  createDbClient: DbClientFactory;
  decryptRefreshToken: TeamPageDeps['decryptRefreshToken'];
  fetchCalendarList: TeamPageDeps['fetchCalendarList'];
  googleClientId?: string;
  googleClientSecret?: string;
  userId: string;
}) {
  const account = await findGoogleAccountByUserId(params.createDbClient, params.userId);
  const refreshToken = params.decryptRefreshToken(account?.refreshToken || null);
  if (!refreshToken) {
    throw badRequestError('Missing calendar credentials.', 'missing_calendar_credentials');
  }

  try {
    return await params.fetchCalendarList({
      refreshToken,
      clientId: params.googleClientId,
      clientSecret: params.googleClientSecret
    });
  } catch {
    throw internalError('Calendar sync failed.', 'calendar_sync_failed');
  }
}
