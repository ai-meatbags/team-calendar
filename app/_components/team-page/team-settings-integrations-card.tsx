'use client';

import React from 'react';
import { TeamSettingsSectionCard } from './team-settings-section-card';
import { TeamWebhookSettingsSection } from './team-webhook-settings-section';
import type { TeamWebhookSettingsViewModel } from './team-webhook-settings-contract';

export function TeamSettingsIntegrationsCard({
  teamSettings,
  canManage
}: {
  teamSettings: TeamWebhookSettingsViewModel;
  canManage: boolean;
}) {
  function openCreateRow() {
    if (!canManage) {
      return;
    }
    void teamSettings.beginWebhookDraft();
  }

  return (
    <TeamSettingsSectionCard
      title="Вебхуки"
      meta={
        <button
          className="btn btn--ghost btn--sm"
          type="button"
          onClick={openCreateRow}
          disabled={!canManage || teamSettings.webhookCreatePending || Boolean(teamSettings.webhookDraft)}
        >
          Добавить вебхук
        </button>
      }
    >
      <TeamWebhookSettingsSection
        teamSettings={teamSettings}
        onOpenCreate={openCreateRow}
        canManage={canManage}
      />
    </TeamSettingsSectionCard>
  );
}
