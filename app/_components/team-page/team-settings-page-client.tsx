'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../app-context';
import { TeamSettingsDangerZoneCard } from './team-settings-danger-zone-card';
import { TeamSlotRuleSettingsSection } from './team-slot-rule-settings-section';
import { TeamSettingsFormSection } from './team-settings-form-section';
import { TeamSettingsCalendarsCard } from './team-settings-calendars-card';
import { TeamSettingsIntegrationsCard } from './team-settings-integrations-card';
import { useTeamSettingsPage } from './team-settings-page-hooks';

export default function TeamSettingsPageClient({ shareId }: { shareId: string }) {
  const router = useRouter();
  const { apiFetch, showToast } = useApp();
  const teamSettings = useTeamSettingsPage({
    shareId,
    apiFetch,
    showToast,
    navigateHome: () => router.push('/')
  });
  const teamName = teamSettings.teamNameDraft.trim();
  const pageTitle = teamName ? `Настройки команды "${teamName}"` : 'Настройки команды';

  return (
    <section className="card profile-settings-card team-settings-sheet">
      <header className="profile-settings-card__header team-settings-sheet__header">
        <div>
          <h1>{pageTitle}</h1>
        </div>
        <Link className="btn btn--ghost btn--sm" href={`/t/${shareId}`}>
          Вернуться к слотам
        </Link>
      </header>

      <form className="team-settings-form" onSubmit={(event) => void teamSettings.handleTeamSettingsSubmit(event)}>
        <TeamSettingsFormSection teamSettings={teamSettings} />

        <TeamSlotRuleSettingsSection
          draft={teamSettings.slotRuleDraft}
          hasOverride={teamSettings.slotRuleHasOverride}
          isLoading={teamSettings.teamSettingsLoading}
          isSaving={teamSettings.slotRuleSaving}
          onChange={teamSettings.handleSlotRuleChange}
          onReset={teamSettings.handleTeamSlotRuleReset}
        />

        <TeamSettingsCalendarsCard
          selection={teamSettings.calendarSelection}
          isLoading={teamSettings.teamSettingsLoading}
          isSaving={teamSettings.teamSettingsSaving}
          onChange={teamSettings.handleSelectionChange}
        />

        <div className="team-settings-form__actions">
          <button className="btn btn--primary btn--sm" type="submit" disabled={teamSettings.teamSettingsSaving}>
            Сохранить выбранные календари
          </button>
        </div>
      </form>

      <TeamSettingsIntegrationsCard
        teamSettings={teamSettings}
        canManage={teamSettings.canDelete}
      />

      {teamSettings.canDelete ? <TeamSettingsDangerZoneCard onDelete={teamSettings.handleDelete} /> : null}
    </section>
  );
}
