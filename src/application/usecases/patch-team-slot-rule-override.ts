import { eq } from 'drizzle-orm';
import { badRequestError, forbiddenError, notFoundError } from '@/application/errors';
import { parseSlotRuleSettingsStrict } from '@/domain/slot-rules';
import {
  findMemberByTeamAndUser,
  findTeamByShareId,
  getDbHandles,
  toSlotRuleValues,
  type SlotRuleSettingsDeps
} from './slot-rule-settings-shared';

export async function patchTeamSlotRuleOverride(
  shareId: string,
  userId: string,
  payload: unknown,
  deps: SlotRuleSettingsDeps & { generateId: () => string }
) {
  const team = await findTeamByShareId(deps.createDbClient, shareId);
  if (!team) {
    throw notFoundError('Team not found.', 'team_not_found');
  }

  const member = await findMemberByTeamAndUser(deps.createDbClient, team.id, userId);
  if (!member) {
    throw forbiddenError('Not a team member.', 'not_team_member');
  }

  const { settings, error } = parseSlotRuleSettingsStrict(payload);
  if (error || !settings) {
    throw badRequestError(error?.message || 'Invalid slot rule settings payload.', error?.code);
  }

  const { db, schema } = getDbHandles(deps.createDbClient);
  const rows = await db
    .select()
    .from(schema.teamMemberSlotRuleOverrides)
    .where(eq(schema.teamMemberSlotRuleOverrides.teamMemberId, member.id))
    .limit(1);
  const nowIso = new Date().toISOString();

  if (rows[0]) {
    await db
      .update(schema.teamMemberSlotRuleOverrides)
      .set({
        ...toSlotRuleValues(settings),
        updatedAt: nowIso
      })
      .where(eq(schema.teamMemberSlotRuleOverrides.teamMemberId, member.id));
  } else {
    await db.insert(schema.teamMemberSlotRuleOverrides).values({
      id: deps.generateId(),
      teamMemberId: member.id,
      ...toSlotRuleValues(settings),
      createdAt: nowIso,
      updatedAt: nowIso
    });
  }

  return {
    slotRuleOverride: settings
  };
}
