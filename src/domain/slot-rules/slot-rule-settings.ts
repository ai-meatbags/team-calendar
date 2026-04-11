export type SlotRuleSettings = {
  days: number;
  workdayStartHour: number;
  workdayEndHour: number;
  minNoticeHours: number;
};

export const SYSTEM_SLOT_RULE_DEFAULTS: SlotRuleSettings = Object.freeze({
  days: 14,
  workdayStartHour: 10,
  workdayEndHour: 20,
  minNoticeHours: 12
});

export function cloneSlotRuleSettings(settings: SlotRuleSettings): SlotRuleSettings {
  return {
    days: settings.days,
    workdayStartHour: settings.workdayStartHour,
    workdayEndHour: settings.workdayEndHour,
    minNoticeHours: settings.minNoticeHours
  };
}

export function areSlotRuleSettingsEqual(left: SlotRuleSettings, right: SlotRuleSettings) {
  return (
    left.days === right.days &&
    left.workdayStartHour === right.workdayStartHour &&
    left.workdayEndHour === right.workdayEndHour &&
    left.minNoticeHours === right.minNoticeHours
  );
}
