'use client';

import React from 'react';
import { TeamSettingsCalendarSelection, TeamSettingsCalendarSelectionSkeleton } from './team-settings-calendar-selection';
import { TeamSettingsSectionCard } from './team-settings-section-card';
import type { CalendarSelectionItem } from './team-page-types';

export function TeamSettingsCalendarsCard({
  selection,
  isLoading,
  isSaving,
  onChange
}: {
  selection: Record<string, CalendarSelectionItem>;
  isLoading: boolean;
  isSaving: boolean;
  onChange: (id: string, value: CalendarSelectionItem) => void;
}) {
  return (
    <TeamSettingsSectionCard
      title="Календари"
      description="Календари, которые участвуют в поиске слотов"
    >
      <div className="team-settings-calendar-shell">
        {isLoading ? (
          <TeamSettingsCalendarSelectionSkeleton rows={7} />
        ) : (
          <TeamSettingsCalendarSelection
            selection={selection}
            onChange={onChange}
            disabled={isSaving}
          />
        )}
      </div>
    </TeamSettingsSectionCard>
  );
}
