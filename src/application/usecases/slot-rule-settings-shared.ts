import { and, eq, inArray } from 'drizzle-orm';
import type { DbClientProvider } from '@/ports/db';
import { internalError } from '@/application/errors';
import { type SlotRuleSettings } from '@/domain/slot-rules';

export type DbClientFactory = () => DbClientProvider;

export type SlotRuleSettingsDeps = {
  createDbClient: DbClientFactory;
};

export type TeamMemberSlotRuleRecord = {
  memberId: string;
  memberPublicId: string;
  userId: string;
  name: string;
  picture: string | null;
  hasOverride: boolean;
  settings: SlotRuleSettings;
};

type UserRow = Record<string, unknown> & {
  id: string;
  name?: string | null;
  image?: string | null;
};

export function getDbHandles(createDbClient: DbClientFactory) {
  const client = createDbClient();
  return {
    db: client.db as any,
    schema: client.schema as any
  };
}

export function mapSlotRuleRow(row: Record<string, unknown> | null | undefined): SlotRuleSettings | null {
  if (!row) {
    return null;
  }

  return {
    days: Number(row.days),
    workdayStartHour: Number(row.workdayStartHour),
    workdayEndHour: Number(row.workdayEndHour),
    minNoticeHours: Number(row.minNoticeHours)
  };
}

export function toSlotRuleValues(settings: SlotRuleSettings) {
  return {
    days: settings.days,
    workdayStartHour: settings.workdayStartHour,
    workdayEndHour: settings.workdayEndHour,
    minNoticeHours: settings.minNoticeHours
  };
}

export async function findTeamByShareId(createDbClient: DbClientFactory, shareId: string) {
  const { db, schema } = getDbHandles(createDbClient);
  const teams = await db.select().from(schema.teams).where(eq(schema.teams.shareId, shareId)).limit(1);
  return teams[0] || null;
}

export async function findUserById(createDbClient: DbClientFactory, userId: string) {
  const { db, schema } = getDbHandles(createDbClient);
  const users = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  return users[0] || null;
}

export async function findMemberByTeamAndUser(createDbClient: DbClientFactory, teamId: string, userId: string) {
  const { db, schema } = getDbHandles(createDbClient);
  const members = await db
    .select()
    .from(schema.teamMembers)
    .where(and(eq(schema.teamMembers.teamId, teamId), eq(schema.teamMembers.userId, userId)))
    .limit(1);
  return members[0] || null;
}

export async function requireUserDefaults(userId: string, deps: SlotRuleSettingsDeps) {
  const { db, schema } = getDbHandles(deps.createDbClient);
  const rows = await db
    .select()
    .from(schema.userSlotRuleSettings)
    .where(eq(schema.userSlotRuleSettings.userId, userId))
    .limit(1);
  const settings = mapSlotRuleRow(rows[0]);
  if (!settings) {
    throw internalError('Missing slot rule defaults.', 'slot_rule_defaults_missing');
  }
  return settings;
}

export async function listTeamMemberRecords(
  teamId: string,
  deps: SlotRuleSettingsDeps
): Promise<TeamMemberSlotRuleRecord[]> {
  const { db, schema } = getDbHandles(deps.createDbClient);
  const members = await db.select().from(schema.teamMembers).where(eq(schema.teamMembers.teamId, teamId));
  if (!members.length) {
    return [];
  }

  const userIds = members.map((member: any) => String(member.userId));
  const memberIds = members.map((member: any) => String(member.id));

  const users = await db.select().from(schema.users).where(inArray(schema.users.id, userIds));
  const defaults = await db
    .select()
    .from(schema.userSlotRuleSettings)
    .where(inArray(schema.userSlotRuleSettings.userId, userIds));
  const overrides = await db
    .select()
    .from(schema.teamMemberSlotRuleOverrides)
    .where(inArray(schema.teamMemberSlotRuleOverrides.teamMemberId, memberIds));

  const usersById = new Map<string, UserRow>(
    users.map((user: any) => [String(user.id), user as UserRow])
  );
  const defaultsByUserId = new Map<string, SlotRuleSettings | null>(
    defaults.map((row: any) => [String(row.userId), mapSlotRuleRow(row)])
  );
  const overridesByMemberId = new Map<string, SlotRuleSettings | null>(
    overrides.map((row: any) => [String(row.teamMemberId), mapSlotRuleRow(row)])
  );

  return members.map((member: any) => {
    const user = usersById.get(String(member.userId));
    if (!user) {
      throw internalError('Team member user is missing.', 'team_member_user_missing');
    }

    const defaultSettings = defaultsByUserId.get(String(member.userId));
    if (!defaultSettings) {
      throw internalError('Missing slot rule defaults.', 'slot_rule_defaults_missing');
    }

    const overrideSettings = overridesByMemberId.get(String(member.id));

    return {
      memberId: String(member.id),
      memberPublicId: String(member.memberPublicId || '').trim(),
      userId: String(member.userId),
      name: String(user.name || 'Участник'),
      picture: user.image || null,
      hasOverride: overridesByMemberId.has(String(member.id)),
      settings: overrideSettings || defaultSettings
    } satisfies TeamMemberSlotRuleRecord;
  });
}
