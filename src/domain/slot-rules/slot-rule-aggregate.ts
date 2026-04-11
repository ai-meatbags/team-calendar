import type { SlotRuleSettings } from './slot-rule-settings';

export function computeSlotRuleAggregate(settingsList: SlotRuleSettings[]) {
  if (!Array.isArray(settingsList) || settingsList.length === 0) {
    return null;
  }

  return settingsList.reduce<SlotRuleSettings>(
    (aggregate, current) => ({
      days: Math.max(aggregate.days, current.days),
      workdayStartHour: Math.max(aggregate.workdayStartHour, current.workdayStartHour),
      workdayEndHour: Math.min(aggregate.workdayEndHour, current.workdayEndHour),
      minNoticeHours: Math.max(aggregate.minNoticeHours, current.minNoticeHours)
    }),
    {
      ...settingsList[0]
    }
  );
}
