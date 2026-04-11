'use client';

import React from 'react';
import type { SlotRuleSettings } from '@/domain/slot-rules';
import { SlotRuleSettingsFields } from '../slot-rule-settings-fields';
import { TeamSettingsSectionCard } from './team-settings-section-card';

export function TeamSlotRuleSettingsSection({
  draft,
  hasOverride,
  isLoading,
  isSaving,
  onChange,
  onReset
}: {
  draft: SlotRuleSettings;
  hasOverride: boolean;
  isLoading: boolean;
  isSaving: boolean;
  onChange: (key: keyof SlotRuleSettings, value: number) => void;
  onReset: () => Promise<void>;
}) {
  return (
    <TeamSettingsSectionCard
      title="Мои правила слотов"
      className="team-settings-section--slot-rules"
    >
      <div className="team-settings-stack">
        <SlotRuleSettingsFields
          settings={draft}
          disabled={isLoading || isSaving}
          idPrefix="team-slot-rules"
          layout="compact"
          onChange={onChange}
        />

        <div className="team-settings-inline-actions">
          <button
            className="btn btn--ghost btn--sm"
            type="button"
            onClick={() => void onReset()}
            disabled={isLoading || isSaving || !hasOverride}
          >
            Сбросить до настроек из профиля
          </button>
        </div>
      </div>
    </TeamSettingsSectionCard>
  );
}
