import { SYSTEM_SLOT_RULE_DEFAULTS, type SlotRuleSettings } from '@/domain/slot-rules';

export function buildDefaultSlotRuleSettingsInsert(params: {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
  defaults?: SlotRuleSettings;
}) {
  const defaults = params.defaults || SYSTEM_SLOT_RULE_DEFAULTS;
  return {
    id: params.id,
    userId: params.userId,
    days: defaults.days,
    workdayStartHour: defaults.workdayStartHour,
    workdayEndHour: defaults.workdayEndHour,
    minNoticeHours: defaults.minNoticeHours,
    createdAt: params.createdAt,
    updatedAt: params.updatedAt || params.createdAt
  };
}
