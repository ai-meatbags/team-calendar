'use client';

import { useCallback, useEffect, useState } from 'react';
import type { TeamMember } from './team-page-types';
import type { ApiFetch } from './team-page-state';

type AvailabilitySlot = {
  start: string;
  end: string;
  members?: TeamMember[];
};

type AvailabilityResponse = {
  slots?: AvailabilitySlot[];
  days?: number;
  workdayStartHour?: number;
  workdayEndHour?: number;
  minNoticeHours?: number;
  timeMin?: string;
  timeMax?: string;
};

function getAvailabilityErrorMessage() {
  return 'Не удалось загрузить свободные слоты';
}

export function useTeamPageAvailability({
  shareId,
  apiFetch,
  isEnabled,
  selectedMemberPublicId,
  duration
}: {
  shareId: string;
  apiFetch: ApiFetch;
  isEnabled: boolean;
  selectedMemberPublicId: string | null;
  duration: number;
}) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [settingsSummary, setSettingsSummary] = useState<AvailabilityResponse | null>(null);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [slotsStatus, setSlotsStatus] = useState('');

  const loadAvailability = useCallback(async () => {
    if (!shareId) {
      return;
    }

    setIsSlotsLoading(true);
    setSlotsStatus('');
    try {
      const query = new URLSearchParams({ duration: String(duration) });
      if (selectedMemberPublicId) {
        query.set('member', selectedMemberPublicId);
      }
      const data = (await apiFetch(`/api/teams/${shareId}/availability?${query.toString()}`)) as AvailabilityResponse;
      setSlots(data.slots || []);
      setSettingsSummary(data || null);
      setSlotsStatus('');
      setHasLoadedOnce(true);
    } catch {
      setSlots([]);
      setSettingsSummary(null);
      setSlotsStatus(getAvailabilityErrorMessage());
      setHasLoadedOnce(true);
    } finally {
      setIsSlotsLoading(false);
    }
  }, [apiFetch, duration, selectedMemberPublicId, shareId]);

  useEffect(() => {
    if (!isEnabled) {
      setHasLoadedOnce(false);
      return;
    }
    void loadAvailability();
  }, [isEnabled, loadAvailability]);

  return {
    slots,
    settingsSummary,
    isSlotsLoading,
    hasLoadedOnce,
    slotsStatus,
    refreshAvailability: loadAvailability
  };
}
