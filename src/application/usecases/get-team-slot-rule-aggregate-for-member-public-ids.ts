import { internalError } from '@/application/errors';
import { cloneSlotRuleSettings, computeSlotRuleAggregate } from '@/domain/slot-rules';
import { listEffectiveTeamMemberSlotRules } from './list-effective-team-member-slot-rules';
import { type SlotRuleSettingsDeps } from './slot-rule-settings-shared';

export async function getTeamSlotRuleAggregateForMemberPublicIds(
  shareId: string,
  memberPublicIds: string[] | null | undefined,
  deps: SlotRuleSettingsDeps
) {
  const members = await listEffectiveTeamMemberSlotRules(shareId, deps);
  const selectedIds = new Set(
    (memberPublicIds || []).map((value) => String(value || '').trim()).filter(Boolean)
  );
  const filteredMembers = selectedIds.size
    ? members.filter((member) => selectedIds.has(member.memberPublicId))
    : members;

  const aggregate = computeSlotRuleAggregate(filteredMembers.map((member) => member.settings));
  if (!aggregate) {
    throw internalError('Team aggregate is missing.', 'team_slot_rule_aggregate_missing');
  }

  return {
    memberCount: filteredMembers.length,
    ...cloneSlotRuleSettings(aggregate)
  };
}
