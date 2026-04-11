import { forbiddenError, internalError, notFoundError } from '@/application/errors';
import { cloneSlotRuleSettings, computeSlotRuleAggregate } from '@/domain/slot-rules';
import {
  findMemberByTeamAndUser,
  findTeamByShareId,
  listTeamMemberRecords,
  type SlotRuleSettingsDeps
} from './slot-rule-settings-shared';

export async function getTeamSlotRuleSettings(
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

  const allMembers = await listTeamMemberRecords(team.id, deps);
  const mySettings = allMembers.find((entry) => entry.memberId === String(member.id));
  if (!mySettings) {
    throw internalError('Team member settings are missing.', 'team_member_slot_rules_missing');
  }

  const teamAggregate = computeSlotRuleAggregate(allMembers.map((entry) => entry.settings));
  if (!teamAggregate) {
    throw internalError('Team aggregate is missing.', 'team_slot_rule_aggregate_missing');
  }

  const owner = allMembers.find((entry) => entry.userId === String(team.ownerId));

  return {
    owner: owner
      ? {
          name: owner.name,
          picture: owner.picture
        }
      : null,
    mySlotRuleSettings: {
      source: mySettings.hasOverride ? 'override' : 'default',
      values: cloneSlotRuleSettings(mySettings.settings),
      hasOverride: mySettings.hasOverride
    },
    teamSlotRuleAggregate: {
      memberCount: allMembers.length,
      ...cloneSlotRuleSettings(teamAggregate)
    }
  };
}
