'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { groupSlotsByWeek } from './team-page-week-groups';
import { SlotListMode } from './team-page-slot-list-mode';
import { SlotsSkeleton } from './team-page-slot-skeleton';
import { TeamPageSlotRulesSummary } from './team-page-slot-rules-summary';
import { SlotViewToggle } from './team-page-slot-view-toggle';
import { SlotWeekGridMode } from './team-page-slot-week-grid';
import {
  buildWeekGridTimeline,
  type SlotsViewportMode,
  type SlotViewMode,
  type SlotWeekGroup
} from './team-page-slot-view-model';
import { SlotsFeedback } from './team-page-slots-feedback';
import type { TeamMember } from './team-page-types';

const DESKTOP_SLOT_VIEW_QUERY = '(min-width: 1100px)';
export const SLOT_VIEW_MODE_STORAGE_KEY = 'team-calendar:slot-view-mode:v1';

export function parseStoredSlotViewMode(
  value: string | null | undefined,
  fallback: SlotViewMode = 'week'
): SlotViewMode {
  return value === 'list' || value === 'week' ? value : fallback;
}

export function usePersistentSlotViewMode(initialViewMode: SlotViewMode = 'week') {
  const [preferredViewMode, setPreferredViewMode] = useState<SlotViewMode>(initialViewMode);
  const [hasLoadedStoredViewMode, setHasLoadedStoredViewMode] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setHasLoadedStoredViewMode(true);
      return;
    }

    try {
      const storedViewMode = window.localStorage.getItem(SLOT_VIEW_MODE_STORAGE_KEY);
      setPreferredViewMode(parseStoredSlotViewMode(storedViewMode, initialViewMode));
    } catch {
      setPreferredViewMode(initialViewMode);
    }

    setHasLoadedStoredViewMode(true);
  }, [initialViewMode]);

  useEffect(() => {
    if (!hasLoadedStoredViewMode || typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(SLOT_VIEW_MODE_STORAGE_KEY, preferredViewMode);
    } catch {
      // Ignore storage failures to keep the slot picker usable in restricted browsers.
    }
  }, [hasLoadedStoredViewMode, preferredViewMode]);

  return {
    preferredViewMode,
    setPreferredViewMode
  };
}

export type SlotsViewProps = {
  slots: Array<{ start: string; end: string; members?: TeamMember[] }>;
  isLoading: boolean;
  hasLoadedOnce: boolean;
  slotsStatus: string;
  settingsSummary: {
    days?: number;
    workdayStartHour?: number;
    workdayEndHour?: number;
    minNoticeHours?: number;
    timeMin?: string;
    timeMax?: string;
  } | null;
  onSlotClick: (slot: { start: string; end: string; members?: SlotWeekGroup['days'][number]['slots'][number]['members'] }) => void;
  viewportMode?: SlotsViewportMode;
  initialViewMode?: SlotViewMode;
  withCardShell?: boolean;
  showRules?: boolean;
  showTitle?: boolean;
  showViewToggle?: boolean;
  preferredViewMode?: SlotViewMode;
  onPreferredViewModeChange?: (mode: SlotViewMode) => void;
};

function useDesktopSlotsViewport(viewportMode: SlotsViewportMode) {
  const [isDesktop, setIsDesktop] = useState(viewportMode === 'desktop');

  useEffect(() => {
    if (viewportMode === 'desktop') {
      setIsDesktop(true);
      return;
    }

    if (viewportMode === 'mobile') {
      setIsDesktop(false);
      return;
    }

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      setIsDesktop(false);
      return;
    }

    const mediaQuery = window.matchMedia(DESKTOP_SLOT_VIEW_QUERY);
    const applyMatch = () => {
      setIsDesktop(mediaQuery.matches);
    };

    applyMatch();
    mediaQuery.addEventListener('change', applyMatch);
    return () => {
      mediaQuery.removeEventListener('change', applyMatch);
    };
  }, [viewportMode]);

  return isDesktop;
}

export function SlotsView({
  slots,
  isLoading,
  hasLoadedOnce,
  slotsStatus,
  settingsSummary,
  onSlotClick,
  viewportMode = 'auto',
  initialViewMode = 'week',
  withCardShell = true,
  showRules = true,
  showTitle = true,
  showViewToggle = true,
  preferredViewMode: controlledPreferredViewMode,
  onPreferredViewModeChange
}: SlotsViewProps) {
  const groupedWeeks = useMemo(() => groupSlotsByWeek(slots), [slots]);
  const weekGridTimeline = useMemo(
    () =>
      buildWeekGridTimeline({
        workdayStartHour: settingsSummary?.workdayStartHour,
        workdayEndHour: settingsSummary?.workdayEndHour,
        weeks: groupedWeeks
      }),
    [groupedWeeks, settingsSummary?.workdayEndHour, settingsSummary?.workdayStartHour]
  );
  const isDesktopViewport = useDesktopSlotsViewport(viewportMode);
  const {
    preferredViewMode: uncontrolledPreferredViewMode,
    setPreferredViewMode: setUncontrolledPreferredViewMode
  } = usePersistentSlotViewMode(initialViewMode);
  const preferredViewMode = controlledPreferredViewMode ?? uncontrolledPreferredViewMode;
  const setPreferredViewMode = onPreferredViewModeChange ?? setUncontrolledPreferredViewMode;

  const effectiveViewMode = isDesktopViewport ? preferredViewMode : 'list';

  const content = (
    <>
      <div className="card__header card__header--row">
        <div className="slot-header">
          {showTitle ? (
            <div className="slot-title-row">
              <h1>Выбери слот</h1>
            </div>
          ) : null}
          {showRules ? <TeamPageSlotRulesSummary settingsSummary={settingsSummary} /> : null}
        </div>
        {viewportMode === 'mobile' || !showViewToggle ? null : (
          <SlotViewToggle mode={preferredViewMode} onModeChange={setPreferredViewMode} />
        )}
      </div>

      <div className="slots" data-slot-view-mode={effectiveViewMode}>
        {isLoading || !hasLoadedOnce ? (
          <SlotsSkeleton mode={effectiveViewMode} />
        ) : slotsStatus ? (
          <SlotsFeedback variant="error" message={slotsStatus} />
        ) : groupedWeeks.length ? (
          effectiveViewMode === 'week' ? (
            <SlotWeekGridMode
              weeks={groupedWeeks}
              timeline={weekGridTimeline}
              onSlotClick={onSlotClick}
            />
          ) : (
            <SlotListMode weeks={groupedWeeks} onSlotClick={onSlotClick} />
          )
        ) : (
          <SlotsFeedback variant="empty" message="Свободных слотов пока нет" />
        )}
      </div>
    </>
  );

  if (!withCardShell) {
    return <div className="card--slots-embedded">{content}</div>;
  }

  return <div className="card card--slots">{content}</div>;
}
