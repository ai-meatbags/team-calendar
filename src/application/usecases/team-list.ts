import { eq, inArray } from 'drizzle-orm';
import type { DbClientProvider } from '@/ports/db';

type DbClientFactory = () => DbClientProvider;
type TeamSummaryMember = {
  name: string;
  picture: string | null;
};

type TeamSummaryListItem = {
  members: TeamSummaryMember[];
  myAvailability: {
    workdayStartHour: number;
    workdayEndHour: number;
  } | null;
  name: string;
  shareId: string;
};

function getDbHandles(createDbClient: DbClientFactory) {
  const client = createDbClient();
  return {
    db: client.db as any,
    schema: client.schema as any
  };
}

function resolveMyAvailability(params: {
  defaultSettings: any | null;
  overrideSettings: any | null;
}) {
  const source = params.overrideSettings || params.defaultSettings;
  if (!source) {
    return null;
  }

  return {
    workdayStartHour: source.workdayStartHour,
    workdayEndHour: source.workdayEndHour
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

  const teamIds = Array.from(new Set(memberships.map((membership: any) => String(membership.teamId))));
  const membershipIds = memberships.map((membership: any) => String(membership.id));

  const [teams, members, users, defaultSettingsRows, overrideRows] = await Promise.all([
    db.select().from(schema.teams).where(inArray(schema.teams.id, teamIds)),
    db.select().from(schema.teamMembers).where(inArray(schema.teamMembers.teamId, teamIds)),
    db.select().from(schema.users),
    db.select().from(schema.userSlotRuleSettings).where(eq(schema.userSlotRuleSettings.userId, params.userId)).limit(1),
    membershipIds.length
      ? db
          .select()
          .from(schema.teamMemberSlotRuleOverrides)
          .where(inArray(schema.teamMemberSlotRuleOverrides.teamMemberId, membershipIds))
      : Promise.resolve([])
  ]);

  const teamById = new Map(teams.map((team: any) => [String(team.id), team]));
  const userById = new Map<string, any>(users.map((user: any) => [String(user.id), user]));
  const membersByTeamId = new Map<string, any[]>();
  const overrideByTeamMemberId = new Map(
    overrideRows.map((override: any) => [String(override.teamMemberId), override])
  );
  const defaultSettings = defaultSettingsRows[0] || null;

  for (const member of members) {
    const teamId = String(member.teamId);
    const nextMembers = membersByTeamId.get(teamId) || [];
    nextMembers.push(member);
    membersByTeamId.set(teamId, nextMembers);
  }

  return {
    teams: memberships
      .map((membership: any) => {
        const team = teamById.get(String(membership.teamId)) as any;
        if (!team) {
          return null;
        }

        const teamMembers = ((membersByTeamId.get(String(team.id)) || []) as any[])
          .map((member: any) => {
            const user = userById.get(String(member.userId)) as any;
            if (!user) {
              return null;
            }

            return {
              name: user.name || 'Участник',
              picture: user.image || null
            };
          })
          .filter(Boolean) as TeamSummaryMember[];

        return {
          name: team.name,
          shareId: team.shareId,
          members: teamMembers,
          myAvailability: resolveMyAvailability({
            defaultSettings,
            overrideSettings: overrideByTeamMemberId.get(String(membership.id)) || null
          })
        } as TeamSummaryListItem;
      })
      .filter(Boolean) as TeamSummaryListItem[]
  };
}
