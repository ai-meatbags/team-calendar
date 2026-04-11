'use client';

import type { SlotRuleSettings } from '@/domain/slot-rules';

export const TEAM_SETTINGS_AUTOSAVE_DEBOUNCE_MS = 700;

export function areSlotRuleSettingsEqual(left: SlotRuleSettings, right: SlotRuleSettings) {
  return (
    left.days === right.days &&
    left.workdayStartHour === right.workdayStartHour &&
    left.workdayEndHour === right.workdayEndHour &&
    left.minNoticeHours === right.minNoticeHours
  );
}
