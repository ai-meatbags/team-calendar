'use client';

import { useCallback, useEffect, useState } from 'react';
import { SYSTEM_SLOT_RULE_DEFAULTS, type SlotRuleSettings } from '@/domain/slot-rules';
import type { ApiFetch } from './team-page-state';
import { coerceSlotRuleSettings, type TeamSettingsResponse } from './team-settings-contract';
import {
  areSlotRuleSettingsEqual,
  TEAM_SETTINGS_AUTOSAVE_DEBOUNCE_MS
} from './team-settings-autosave';

export function useTeamSettingsSlotRules({
  shareId,
  apiFetch,
  showToast
}: {
  shareId: string;
  apiFetch: ApiFetch;
  showToast: (message: string) => void;
}) {
  const [slotRuleDraft, setSlotRuleDraft] = useState<SlotRuleSettings>({ ...SYSTEM_SLOT_RULE_DEFAULTS });
  const [baseSlotRuleDraft, setBaseSlotRuleDraft] = useState<SlotRuleSettings>({ ...SYSTEM_SLOT_RULE_DEFAULTS });
  const [slotRuleSource, setSlotRuleSource] = useState<'default' | 'override'>('default');
  const [slotRuleHasOverride, setSlotRuleHasOverride] = useState(false);
  const [slotRuleAggregate, setSlotRuleAggregate] = useState<SlotRuleSettings>({ ...SYSTEM_SLOT_RULE_DEFAULTS });
  const [slotRuleAggregateMemberCount, setSlotRuleAggregateMemberCount] = useState(0);
  const [slotRuleOwner, setSlotRuleOwner] = useState<{ name: string; picture: string | null } | null>(null);
  const [slotRuleSaving, setSlotRuleSaving] = useState(false);
  const [slotRuleStatus, setSlotRuleStatus] = useState('');
  const [hasLoadedSlotRules, setHasLoadedSlotRules] = useState(false);

  const applyLoadedSlotRules = useCallback((data: TeamSettingsResponse) => {
    const loadedSlotRules = coerceSlotRuleSettings(data.mySlotRuleSettings?.values);
    setSlotRuleDraft(loadedSlotRules);
    setBaseSlotRuleDraft(loadedSlotRules);
    setSlotRuleSource(data.mySlotRuleSettings?.source === 'override' ? 'override' : 'default');
    setSlotRuleHasOverride(Boolean(data.mySlotRuleSettings?.hasOverride));
    setSlotRuleAggregate(coerceSlotRuleSettings(data.teamSlotRuleAggregate));
    setSlotRuleAggregateMemberCount(Number(data.teamSlotRuleAggregate?.memberCount || 0));
    setSlotRuleOwner(
      data.owner
        ? {
            name: String(data.owner.name || 'Участник'),
            picture: data.owner.picture || null
          }
        : null
    );
    setSlotRuleStatus('');
    setHasLoadedSlotRules(true);
  }, []);

  const handleSlotRuleChange = useCallback((key: keyof SlotRuleSettings, value: number) => {
    setSlotRuleDraft((current) => ({
      ...current,
      [key]: value
    }));
  }, []);

  const handleTeamSlotRuleSave = useCallback(async () => {
    if (!shareId) {
      return;
    }

    setSlotRuleSaving(true);
    setSlotRuleStatus('');
    try {
      await apiFetch(`/api/teams/${shareId}/settings/slot-rules`, {
        method: 'PATCH',
        body: JSON.stringify({ slotRuleOverride: slotRuleDraft })
      });
      setBaseSlotRuleDraft(slotRuleDraft);
      setSlotRuleHasOverride(true);
      setSlotRuleSource('override');
      setSlotRuleStatus('');
      showToast('Правила слотов сохранены');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось сохранить персональные настройки команды';
      setSlotRuleStatus(message || 'Не удалось сохранить персональные настройки команды');
      showToast(message || 'Не удалось сохранить персональные настройки команды');
    } finally {
      setSlotRuleSaving(false);
    }
  }, [apiFetch, shareId, showToast, slotRuleDraft]);

  useEffect(() => {
    if (!shareId || !hasLoadedSlotRules || slotRuleSaving) {
      return;
    }
    if (areSlotRuleSettingsEqual(slotRuleDraft, baseSlotRuleDraft)) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void handleTeamSlotRuleSave();
    }, TEAM_SETTINGS_AUTOSAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [
    baseSlotRuleDraft,
    handleTeamSlotRuleSave,
    hasLoadedSlotRules,
    shareId,
    slotRuleDraft,
    slotRuleSaving
  ]);

  const handleTeamSlotRuleReset = useCallback(async () => {
    if (!shareId || !slotRuleHasOverride) {
      return;
    }

    setSlotRuleSaving(true);
    setSlotRuleStatus('');
    try {
      await apiFetch(`/api/teams/${shareId}/settings/slot-rules`, {
        method: 'DELETE'
      });
      showToast('Настройки команды сброшены до настроек пользователя');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось сбросить настройки команды';
      setSlotRuleStatus(message || 'Не удалось сбросить настройки команды');
      showToast(message || 'Не удалось сбросить настройки команды');
    } finally {
      setSlotRuleSaving(false);
    }
  }, [apiFetch, shareId, showToast, slotRuleHasOverride]);

  return {
    slotRuleDraft,
    slotRuleSource,
    slotRuleHasOverride,
    slotRuleAggregate,
    slotRuleAggregateMemberCount,
    slotRuleOwner,
    slotRuleSaving,
    slotRuleStatus,
    applyLoadedSlotRules,
    handleSlotRuleChange,
    handleTeamSlotRuleSave,
    handleTeamSlotRuleReset
  };
}
