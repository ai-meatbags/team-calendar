import { and, eq } from 'drizzle-orm';
import type { DbClientProvider } from '@/ports/db';
import {
  badRequestError,
  forbiddenError,
  internalError,
  notFoundError,
  unauthorizedError
} from '@/application/errors';
import {
  applyCalendarSelectionPatch,
  mergeCalendarSelection,
  parseCalendarSelectionStrict,
  resolveSelectionSource
} from '@/domain/calendar-selection/selection';
import {
  buildCanJoin,
  isValidTeamPrivacy,
  normalizeTeamPrivacy
} from '@/domain/privacy/team-privacy';

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

type TeamPageDeps = {
  createDbClient: DbClientFactory;
  decryptRefreshToken: (value: string | null | undefined) => string | null;
  fetchCalendarList: (params: FetchCalendarListParams) => Promise<CalendarListItem[]>;
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

async function findTeamByShareId(createDbClient: DbClientFactory, shareId: string) {
  const { db, schema } = getDbHandles(createDbClient);
  const teams = await db.select().from(schema.teams).where(eq(schema.teams.shareId, shareId)).limit(1);
  return teams[0] || null;
}

async function findMemberByTeamAndUser(
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

async function findUserById(createDbClient: DbClientFactory, userId: string) {
  const { db, schema } = getDbHandles(createDbClient);
  const users = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  return users[0] || null;
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

async function listTeamMembersWithUsers(createDbClient: DbClientFactory, teamId: string) {
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

async function getCalendarListForUser(params: {
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

export async function getTeamPage(params: {
  createDbClient: DbClientFactory;
  shareId: string;
  userId?: string | null;
}) {
  const team = await findTeamByShareId(params.createDbClient, params.shareId);
  if (!team) {
    throw notFoundError('Team not found.', 'team_not_found');
  }

  const memberRows = await listTeamMembersWithUsers(params.createDbClient, team.id);
  const privacy = normalizeTeamPrivacy(team.privacy);
  const normalizedUserId = String(params.userId || '').trim();
  const isMember = Boolean(
    normalizedUserId &&
      memberRows.some((row: any) => String(row.member.userId) === normalizedUserId)
  );
  const isOwner = Boolean(normalizedUserId && String(team.ownerId) === normalizedUserId);

  return {
    team: {
      name: team.name,
      shareId: team.shareId,
      privacy
    },
    members: memberRows.map((row: any) => ({
      name: row.user.name || 'Участник',
      picture: row.user.image || null,
      memberPublicId: row.member.memberPublicId
    })),
    isMember,
    isOwner,
    canJoin: buildCanJoin({
      hasUser: Boolean(normalizedUserId),
      isMember,
      privacy
    })
  };
}

export async function listTeamsForUser(
  createDbClient: DbClientFactory,
  params: {
    userId: string;
  }
) {
  const { db, schema } = getDbHandles(createDbClient);
  const memberships = await db
    .select()
    .from(schema.teamMembers)
    .where(eq(schema.teamMembers.userId, params.userId));

  if (!memberships.length) {
    return { teams: [] };
  }

  const rows = await Promise.all(
    memberships.map(async (membership: any) => {
      const teams = await db.select().from(schema.teams).where(eq(schema.teams.id, membership.teamId)).limit(1);
      return teams[0] || null;
    })
  );

  return {
    teams: rows
      .filter(Boolean)
      .map((team: any) => ({
        name: team.name,
        shareId: team.shareId
      }))
  };
}

export async function createTeam(
  createDbClient: DbClientFactory,
  params: {
    userId: string;
    name: string;
    generateId: () => string;
    generateShareId: () => string;
    generateMemberPublicId: () => string;
  }
) {
  const name = String(params.name || '').trim();
  if (!name) {
    throw badRequestError('Missing team name.', 'missing_team_name');
  }

  const { db, schema } = getDbHandles(createDbClient);
  const nowIso = new Date().toISOString();
  const teamId = params.generateId();
  const shareId = params.generateShareId();

  await db.insert(schema.teams).values({
    id: teamId,
    name,
    shareId,
    ownerId: params.userId,
    privacy: normalizeTeamPrivacy('public'),
    createdAt: nowIso,
    updatedAt: nowIso
  });

  await db.insert(schema.teamMembers).values({
    id: params.generateId(),
    teamId,
    userId: params.userId,
    memberPublicId: params.generateMemberPublicId(),
    calendarSelection: null,
    createdAt: nowIso,
    updatedAt: nowIso
  });

  return {
    name,
    shareId
  };
}

export async function getTeamSettings(
  deps: TeamPageDeps,
  params: {
    shareId: string;
    userId: string;
  }
) {
  const team = await findTeamByShareId(deps.createDbClient, params.shareId);
  if (!team) {
    throw notFoundError('Team not found.', 'team_not_found');
  }

  const member = await findMemberByTeamAndUser(deps.createDbClient, team.id, params.userId);
  if (!member) {
    throw forbiddenError('Not a team member.', 'not_team_member');
  }

  const user = await findUserById(deps.createDbClient, params.userId);
  if (!user) {
    throw unauthorizedError();
  }

  const { selectionValue, source } = resolveSelectionSource(
    member.calendarSelection,
    user.calendarSelectionDefault
  );
  const calendarItems = await getCalendarListForUser({
    createDbClient: deps.createDbClient,
    decryptRefreshToken: deps.decryptRefreshToken,
    fetchCalendarList: deps.fetchCalendarList,
    googleClientId: deps.googleClientId,
    googleClientSecret: deps.googleClientSecret,
    userId: user.id
  });

  const { selection: baseSelection, error } = parseCalendarSelectionStrict(selectionValue);
  if (error) {
    throw internalError('Invalid calendar selection.', 'invalid_calendar_selection');
  }

  return {
    team: {
      id: team.id,
      name: team.name,
      shareId: team.shareId
    },
    canEditName: String(team.ownerId) === String(params.userId),
    canEditPrivacy: String(team.ownerId) === String(params.userId),
    canDelete: String(team.ownerId) === String(params.userId),
    privacy: normalizeTeamPrivacy(team.privacy),
    calendarSelection: mergeCalendarSelection(calendarItems, baseSelection),
    calendarSelectionSource: source
  };
}

export async function patchTeamSettings(
  deps: TeamPageDeps,
  params: {
    shareId: string;
    userId: string;
    body: unknown;
  }
) {
  const team = await findTeamByShareId(deps.createDbClient, params.shareId);
  if (!team) {
    throw notFoundError('Team not found.', 'team_not_found');
  }

  const member = await findMemberByTeamAndUser(deps.createDbClient, team.id, params.userId);
  if (!member) {
    throw forbiddenError('Not a team member.', 'not_team_member');
  }

  const user = await findUserById(deps.createDbClient, params.userId);
  if (!user) {
    throw unauthorizedError();
  }

  const body = params.body && typeof params.body === 'object' ? (params.body as Record<string, unknown>) : {};
  const hasName = Object.prototype.hasOwnProperty.call(body, 'name');
  const hasPrivacy = Object.prototype.hasOwnProperty.call(body, 'privacy');
  const hasCalendarSelection = Object.prototype.hasOwnProperty.call(body, 'calendarSelection');

  if (!hasName && !hasPrivacy && !hasCalendarSelection) {
    throw badRequestError('Nothing to update.', 'empty_patch');
  }

  const isOwner = String(team.ownerId) === String(params.userId);

  if (hasName && !isOwner) {
    throw forbiddenError('Only owner can edit team name.', 'team_name_forbidden');
  }
  if (hasPrivacy && !isOwner) {
    throw forbiddenError('Only owner can edit team privacy.', 'team_privacy_forbidden');
  }

  const { db, schema } = getDbHandles(deps.createDbClient);
  const nowIso = new Date().toISOString();

  if (hasName) {
    const name = String(body.name || '').trim();
    if (!name) {
      throw badRequestError('Missing team name.', 'missing_team_name');
    }

    await db
      .update(schema.teams)
      .set({
        name,
        updatedAt: nowIso
      })
      .where(eq(schema.teams.id, team.id));
  }

  if (hasPrivacy) {
    if (!isValidTeamPrivacy(body.privacy)) {
      throw badRequestError('Invalid privacy value.', 'invalid_team_privacy');
    }

    await db
      .update(schema.teams)
      .set({
        privacy: normalizeTeamPrivacy(body.privacy),
        updatedAt: nowIso
      })
      .where(eq(schema.teams.id, team.id));
  }

  if (hasCalendarSelection) {
    const { selectionValue } = resolveSelectionSource(
      member.calendarSelection,
      user.calendarSelectionDefault
    );
    const { selection: baseSelection, error } = parseCalendarSelectionStrict(selectionValue);
    if (error) {
      throw internalError('Invalid calendar selection.', 'invalid_calendar_selection');
    }

    const calendarItems = await getCalendarListForUser({
      createDbClient: deps.createDbClient,
      decryptRefreshToken: deps.decryptRefreshToken,
      fetchCalendarList: deps.fetchCalendarList,
      googleClientId: deps.googleClientId,
      googleClientSecret: deps.googleClientSecret,
      userId: user.id
    });

    const patched = applyCalendarSelectionPatch(
      calendarItems,
      baseSelection,
      body.calendarSelection
    );

    if (patched.error) {
      if (patched.error.status === 400) {
        throw badRequestError('Invalid calendar selection payload.', 'invalid_calendar_selection_payload');
      }
      throw internalError('Invalid calendar selection.', 'invalid_calendar_selection');
    }

    await db
      .update(schema.teamMembers)
      .set({
        calendarSelection: JSON.stringify(patched.selection),
        updatedAt: nowIso
      })
      .where(eq(schema.teamMembers.id, member.id));

    return {
      calendarSelection: patched.selection
    };
  }

  return { updated: true };
}

export async function deleteTeam(
  createDbClient: DbClientFactory,
  params: {
    shareId: string;
    userId: string;
  }
) {
  const team = await findTeamByShareId(createDbClient, params.shareId);
  if (!team) {
    throw notFoundError('Team not found.', 'team_not_found');
  }

  if (String(team.ownerId) !== String(params.userId)) {
    throw forbiddenError('Only owner can delete team.', 'team_delete_forbidden');
  }

  const { db, schema } = getDbHandles(createDbClient);
  await db.delete(schema.teamMembers).where(eq(schema.teamMembers.teamId, team.id));
  await db.delete(schema.teams).where(eq(schema.teams.id, team.id));
  return { deleted: true };
}
