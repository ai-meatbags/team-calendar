'use client';

import React from 'react';
import type { SlotRuleSettings } from '@/domain/slot-rules';

type SlotRuleFieldKey = keyof SlotRuleSettings;

const FIELD_CONFIG: Array<{
  key: SlotRuleFieldKey;
  label: string;
  min: number;
  max: number;
  step?: number;
}> = [
  { key: 'days', label: 'Окно показа, дней', min: 1, max: 30, step: 1 },
  { key: 'workdayStartHour', label: 'С, час', min: 0, max: 23, step: 1 },
  { key: 'workdayEndHour', label: 'До, час', min: 1, max: 24, step: 1 },
  { key: 'minNoticeHours', label: 'Бронь минимум за, часов', min: 1, max: 168, step: 1 }
];

export function SlotRuleSettingsFields({
  settings,
  disabled,
  idPrefix,
  layout = 'stack',
  onChange
}: {
  settings: SlotRuleSettings;
  disabled?: boolean;
  idPrefix: string;
  layout?: 'stack' | 'compact';
  onChange: (key: SlotRuleFieldKey, value: number) => void;
}) {
  return (
    <div className={layout === 'compact' ? 'slot-rule-fields slot-rule-fields--compact' : 'slot-rule-fields'}>
      {FIELD_CONFIG.map((field) => (
        <label className="field" htmlFor={`${idPrefix}-${field.key}`} key={field.key}>
          <span>{field.label}</span>
          <input
            id={`${idPrefix}-${field.key}`}
            type="number"
            min={field.min}
            max={field.max}
            step={field.step || 1}
            value={settings[field.key]}
            disabled={disabled}
            onChange={(event) => {
              const parsed = Number.parseInt(event.target.value || '', 10);
              onChange(field.key, Number.isNaN(parsed) ? field.min : parsed);
            }}
          />
        </label>
      ))}
    </div>
  );
}

export function SlotRuleSettingsSummary({
  title,
  settings,
  memberCount
}: {
  title: string;
  settings: SlotRuleSettings;
  memberCount?: number;
}) {
  return (
    <div className="settings-summary">
      <div className="settings-summary__title">{title}</div>
      <div className="settings-summary__items">
        {typeof memberCount === 'number' ? (
          <span className="setting-block">
            <strong>{memberCount}</strong>
            <span>участников</span>
          </span>
        ) : null}
        <span className="setting-block">
          <strong>{settings.days}</strong>
          <span>дней вперёд</span>
        </span>
        <span className="setting-block">
          <strong>
            {settings.workdayStartHour}:00-{settings.workdayEndHour}:00
          </strong>
          <span>рабочее окно</span>
        </span>
        <span className="setting-block">
          <strong>{settings.minNoticeHours}</strong>
          <span>часов до брони</span>
        </span>
      </div>
    </div>
  );
}
