'use client';

import React from 'react';
import type { FormEvent } from 'react';
import type { SlotRuleSettings } from '@/domain/slot-rules';
import { InfoHint } from './info-hint';
import { SlotRuleSettingsFields } from './slot-rule-settings-fields';

export function ProfileSettingsCard({
  nameDraft,
  isSaving,
  slotRuleSettings,
  isLoadingSlotRules,
  status,
  onNameChange,
  onSubmit,
  onSlotRuleChange
}: {
  nameDraft: string;
  isSaving: boolean;
  slotRuleSettings: SlotRuleSettings;
  isLoadingSlotRules: boolean;
  status: string;
  onNameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onSlotRuleChange: (key: keyof SlotRuleSettings, value: number) => void;
}) {
  return (
    <section className="card profile-settings-card">
      <header className="profile-settings-card__header">
        <div>
          <h1>Профиль</h1>
        </div>
      </header>

      <section className="profile-settings-card__section">
        <form className="profile-settings-card__form" onSubmit={(event) => void onSubmit(event)}>
          <div className="profile-settings-card__group">
            <div className="profile-settings-card__section-copy">
              <div className="profile-settings-card__heading-row">
                <h2>Имя аккаунта</h2>
                <InfoHint
                  label="Кто видит имя аккаунта"
                  text="Это имя увидят участники команды и гости страницы бронирования."
                />
              </div>
            </div>

            <label className="field" htmlFor="profile-name">
              <input
                id="profile-name"
                type="text"
                name="name"
                aria-label="Имя"
                autoComplete="name"
                value={nameDraft}
                onChange={(event) => onNameChange(event.target.value)}
                maxLength={80}
                required
              />
            </label>
          </div>

          <div className="profile-settings-card__group">
            <div className="profile-settings-card__section-copy">
              <h2>Правила поиска доступных слотов</h2>
            </div>

            <SlotRuleSettingsFields
              settings={slotRuleSettings}
              disabled={isLoadingSlotRules || isSaving}
              idPrefix="profile-slot-rules"
              layout="compact"
              onChange={onSlotRuleChange}
            />
          </div>

          {status ? <div className="status">{status}</div> : null}

          <div className="profile-settings-card__actions">
            <button className="btn btn--primary" type="submit" disabled={isLoadingSlotRules || isSaving}>
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </section>
    </section>
  );
}
