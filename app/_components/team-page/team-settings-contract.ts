'use client';

import { SYSTEM_SLOT_RULE_DEFAULTS, type SlotRuleSettings } from '@/domain/slot-rules';
import type { CalendarSelectionItem, TeamWebhookItem } from './team-page-types';

export type TeamSettingsResponse = {
  team?: {
    name?: string;
    shareId?: string;
  };
  canEditName?: boolean;
  canEditPrivacy?: boolean;
  canDelete?: boolean;
  privacy?: string;
  calendarSelection?: Record<string, CalendarSelectionItem>;
  owner?: {
    name?: string;
    picture?: string | null;
  } | null;
  mySlotRuleSettings?: {
    source?: 'default' | 'override';
    values?: Partial<SlotRuleSettings>;
    hasOverride?: boolean;
  };
  teamSlotRuleAggregate?: ({
    memberCount?: number;
  } & Partial<SlotRuleSettings>) | null;
};

export type TeamWebhooksResponse = {
  webhooks?: TeamWebhookItem[];
};

export function coerceSlotRuleSettings(value?: Partial<SlotRuleSettings> | null): SlotRuleSettings {
  return {
    days: Number(value?.days ?? SYSTEM_SLOT_RULE_DEFAULTS.days),
    workdayStartHour: Number(value?.workdayStartHour ?? SYSTEM_SLOT_RULE_DEFAULTS.workdayStartHour),
    workdayEndHour: Number(value?.workdayEndHour ?? SYSTEM_SLOT_RULE_DEFAULTS.workdayEndHour),
    minNoticeHours: Number(value?.minNoticeHours ?? SYSTEM_SLOT_RULE_DEFAULTS.minNoticeHours)
  };
}
