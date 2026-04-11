'use client';

import React from 'react';
import type { TeamSettingsPageModel } from './team-settings-page-hooks';
import { TeamSettingsSectionCard } from './team-settings-section-card';

export function TeamSettingsFormSection({
  teamSettings
}: {
  teamSettings: TeamSettingsPageModel;
}) {
  return (
    <TeamSettingsSectionCard title="Команда">
      <div className="team-settings-form__fields">
        <label className="field">
          <span>Наименование команды</span>
          <input
            type="text"
            value={teamSettings.teamNameDraft}
            onChange={(event) => teamSettings.setTeamNameDraft(event.target.value)}
            disabled={!teamSettings.canEditName || teamSettings.teamSettingsSaving}
          />
        </label>

        <div className="field">
          <span>Кто может присоединиться к команде</span>
          <div
            className="toggle team-member-toggle team-settings-toggle"
            role="group"
            aria-label="Кто может присоединиться к команде"
          >
            <button
              type="button"
              className={`team-member-toggle__button ${teamSettings.privacyDraft === 'public' ? 'is-active' : ''}`}
              onClick={() => teamSettings.setPrivacyDraft('public')}
              disabled={!teamSettings.canEditPrivacy || teamSettings.teamSettingsSaving}
            >
              Все могут
            </button>
            <button
              type="button"
              className={`team-member-toggle__button ${teamSettings.privacyDraft === 'private' ? 'is-active' : ''}`}
              onClick={() => teamSettings.setPrivacyDraft('private')}
              disabled={!teamSettings.canEditPrivacy || teamSettings.teamSettingsSaving}
            >
              Никто не может
            </button>
          </div>
        </div>
      </div>
    </TeamSettingsSectionCard>
  );
}
