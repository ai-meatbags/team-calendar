import { notFoundError } from '@/application/errors';
import { findTeamByShareId, listTeamMemberRecords, type SlotRuleSettingsDeps } from './slot-rule-settings-shared';

export async function listEffectiveTeamMemberSlotRules(shareId: string, deps: SlotRuleSettingsDeps) {
  const team = await findTeamByShareId(deps.createDbClient, shareId);
  if (!team) {
    throw notFoundError('Team not found.', 'team_not_found');
  }

  return listTeamMemberRecords(team.id, deps);
}
