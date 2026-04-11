'use client';

import React from 'react';
import { TeamSettingsSectionCard } from './team-settings-section-card';

export function TeamSettingsDangerZoneCard({
  onDelete
}: {
  onDelete: () => Promise<void>;
}) {
  return (
    <TeamSettingsSectionCard
      title="Опасная зона"
      description="Удаление команды необратимо"
    >
      <div className="team-settings-danger-zone">
        <button className="btn btn--ghost btn--sm team-settings-danger-button" type="button" onClick={() => void onDelete()}>
          Удалить команду
        </button>
      </div>
    </TeamSettingsSectionCard>
  );
}
