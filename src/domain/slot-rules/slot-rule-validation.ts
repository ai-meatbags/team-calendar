import type { SlotRuleSettings } from './slot-rule-settings';

type SlotRuleSettingsValidationError = {
  message: string;
  code: string;
};

function createValidationError(
  message: string,
  code: string
): SlotRuleSettingsValidationError {
  return { message, code };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readInteger(
  payload: Record<string, unknown>,
  key: keyof SlotRuleSettings
): number | null {
  const raw = payload[key];
  if (typeof raw !== 'number' || !Number.isInteger(raw)) {
    return null;
  }
  return raw;
}

export function parseSlotRuleSettingsStrict(value: unknown): {
  settings: SlotRuleSettings | null;
  error: SlotRuleSettingsValidationError | null;
} {
  if (!isPlainObject(value)) {
    return {
      settings: null,
      error: createValidationError('Invalid slot rule settings payload.', 'invalid_slot_rule_settings_payload')
    };
  }

  const days = readInteger(value, 'days');
  const workdayStartHour = readInteger(value, 'workdayStartHour');
  const workdayEndHour = readInteger(value, 'workdayEndHour');
  const minNoticeHours = readInteger(value, 'minNoticeHours');

  if (
    days === null ||
    workdayStartHour === null ||
    workdayEndHour === null ||
    minNoticeHours === null
  ) {
    return {
      settings: null,
      error: createValidationError('Invalid slot rule settings payload.', 'invalid_slot_rule_settings_payload')
    };
  }

  if (days < 1 || days > 30) {
    return {
      settings: null,
      error: createValidationError('Slot rule days must be between 1 and 30.', 'invalid_slot_rule_days')
    };
  }

  if (workdayStartHour < 0 || workdayStartHour > 23) {
    return {
      settings: null,
      error: createValidationError(
        'Workday start hour must be between 0 and 23.',
        'invalid_slot_rule_workday_start'
      )
    };
  }

  if (workdayEndHour < 1 || workdayEndHour > 24) {
    return {
      settings: null,
      error: createValidationError(
        'Workday end hour must be between 1 and 24.',
        'invalid_slot_rule_workday_end'
      )
    };
  }

  if (workdayEndHour <= workdayStartHour) {
    return {
      settings: null,
      error: createValidationError(
        'Workday end hour must be later than start hour.',
        'invalid_slot_rule_workday_range'
      )
    };
  }

  if (minNoticeHours < 1 || minNoticeHours > 168) {
    return {
      settings: null,
      error: createValidationError(
        'Minimum notice must be between 1 and 168 hours.',
        'invalid_slot_rule_min_notice'
      )
    };
  }

  return {
    settings: {
      days,
      workdayStartHour,
      workdayEndHour,
      minNoticeHours
    },
    error: null
  };
}
