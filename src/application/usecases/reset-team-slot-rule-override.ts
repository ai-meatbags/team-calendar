import { eq } from 'drizzle-orm';
import { forbiddenError, notFoundError } from '@/application/errors';
import {
  findMemberByTeamAndUser,
  findTeamByShareId,
  getDbHandles,
  type SlotRuleSettingsDeps
} from './slot-rule-settings-shared';

export async function resetTeamSlotRuleOverride(
  shareId: string,
  userId: string,
  deps: SlotRuleSettingsDeps
) {
  const team = await findTeamByShareId(deps.createDbClient, shareId);
  if (!team) {
    throw notFoundError('Team not found.', 'team_not_found');
  }

  const member = await findMemberByTeamAndUser(deps.createDbClient, team.id, userId);
  if (!member) {
    throw forbiddenError('Not a team member.', 'not_team_member');
  }

  const { db, schema } = getDbHandles(deps.createDbClient);
  await db
    .delete(schema.teamMemberSlotRuleOverrides)
    .where(eq(schema.teamMemberSlotRuleOverrides.teamMemberId, member.id));

  return {
    deleted: true
  };
}
