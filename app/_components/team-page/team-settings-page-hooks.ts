'use client';

import { useCallback, useEffect, useState } from 'react';
import { normalizeTeamPrivacy } from './team-page-members';
import type { CalendarSelectionItem } from './team-page-types';
import {
  applySavedTeamSettingsState,
  executeTeamDeleteAction,
  resolveTeamSettingsSubmission,
  TEAM_DELETE_CONFIRMATION_MESSAGE,
  type ApiFetch
} from './team-page-state';
import { type TeamSettingsResponse } from './team-settings-contract';
import { TEAM_SETTINGS_AUTOSAVE_DEBOUNCE_MS } from './team-settings-autosave';
import { useTeamSettingsSlotRules } from './team-settings-slot-rules';
import { useTeamSettingsWebhooks } from './team-settings-webhooks';

export type TeamSettingsPageModel = ReturnType<typeof useTeamSettingsPage>;

export function useTeamSettingsPage({
  shareId,
  apiFetch,
  showToast,
  navigateHome
}: {
  shareId: string;
  apiFetch: ApiFetch;
  showToast: (message: string) => void;
  navigateHome: () => void;
}) {
  const [teamSettingsLoading, setTeamSettingsLoading] = useState(true);
  const [teamSettingsSaving, setTeamSettingsSaving] = useState(false);
  const [calendarSelection, setCalendarSelection] = useState<Record<string, CalendarSelectionItem>>({});
  const [baseSelection, setBaseSelection] = useState<Record<string, CalendarSelectionItem>>({});
  const [teamNameDraft, setTeamNameDraft] = useState('');
  const [baseName, setBaseName] = useState('');
  const [canEditName, setCanEditName] = useState(false);
  const [canEditPrivacy, setCanEditPrivacy] = useState(false);
  const [privacyDraft, setPrivacyDraft] = useState('public');
  const [basePrivacy, setBasePrivacy] = useState('public');
  const [canDelete, setCanDelete] = useState(false);

  const slotRules = useTeamSettingsSlotRules({
    shareId,
    apiFetch,
    showToast
  });

  const webhooks = useTeamSettingsWebhooks({
    shareId,
    apiFetch,
    showToast
  });

  const loadTeamSettings = useCallback(async () => {
    if (!shareId) {
      return;
    }

    setTeamSettingsLoading(true);
    try {
      const data = (await apiFetch(`/api/teams/${shareId}/settings`)) as TeamSettingsResponse;
      const name = data.team?.name || '';
      const privacy = normalizeTeamPrivacy(data.privacy);

      setCanEditName(Boolean(data.canEditName));
      setCanEditPrivacy(Boolean(data.canEditPrivacy));
      setCanDelete(Boolean(data.canDelete));
      setTeamNameDraft(name);
      setBaseName(name);
      setPrivacyDraft(privacy);
      setBasePrivacy(privacy);
      setCalendarSelection(data.calendarSelection || {});
      setBaseSelection(data.calendarSelection || {});
      slotRules.applyLoadedSlotRules(data);
      await webhooks.loadWebhooks(Boolean(data.canDelete));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось загрузить настройки команды';
      await webhooks.loadWebhooks(false);
      showToast(message || 'Не удалось загрузить настройки команды');
    } finally {
      setTeamSettingsLoading(false);
    }
  }, [apiFetch, shareId, showToast]);

  useEffect(() => {
    void loadTeamSettings();
  }, [loadTeamSettings]);

  const handleSelectionChange = useCallback((id: string, value: CalendarSelectionItem) => {
    setCalendarSelection((current) => ({
      ...current,
      [id]: value
    }));
  }, []);

  const saveTeamMetaChanges = useCallback(async () => {
    if (!shareId) {
      return;
    }

    const trimmedName = teamNameDraft.trim();
    const normalizedPrivacy = normalizeTeamPrivacy(privacyDraft);
    const payload: Record<string, unknown> = {};

    if (canEditName && trimmedName !== baseName) {
      payload.name = trimmedName;
    }
    if (canEditPrivacy && normalizedPrivacy !== basePrivacy) {
      payload.privacy = normalizedPrivacy;
    }

    if (!Object.keys(payload).length) {
      return;
    }

    setTeamSettingsSaving(true);
    try {
      await apiFetch(`/api/teams/${shareId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      if ('name' in payload) {
        setTeamNameDraft(trimmedName);
        setBaseName(trimmedName);
      }
      if ('privacy' in payload) {
        setPrivacyDraft(normalizedPrivacy);
        setBasePrivacy(normalizedPrivacy);
      }
      showToast('Настройки команды сохранены');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось сохранить настройки';
      showToast(message || 'Не удалось сохранить настройки');
    } finally {
      setTeamSettingsSaving(false);
    }
  }, [
    apiFetch,
    baseName,
    basePrivacy,
    canEditName,
    canEditPrivacy,
    privacyDraft,
    shareId,
    showToast,
    teamNameDraft
  ]);

  useEffect(() => {
    if (!shareId || teamSettingsLoading || teamSettingsSaving) {
      return;
    }

    const trimmedName = teamNameDraft.trim();
    const normalizedPrivacy = normalizeTeamPrivacy(privacyDraft);
    const hasChanges =
      (canEditName && trimmedName !== baseName) ||
      (canEditPrivacy && normalizedPrivacy !== basePrivacy);

    if (!hasChanges) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void saveTeamMetaChanges();
    }, TEAM_SETTINGS_AUTOSAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [
    baseName,
    basePrivacy,
    canEditName,
    canEditPrivacy,
    privacyDraft,
    saveTeamMetaChanges,
    shareId,
    teamNameDraft,
    teamSettingsLoading,
    teamSettingsSaving
  ]);

  const handleTeamSettingsSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!shareId) {
      return;
    }

    const submission = resolveTeamSettingsSubmission({
      calendarSelection,
      baseSelection,
      teamNameDraft,
      baseName,
      canEditName,
      privacyDraft,
      basePrivacy,
      canEditPrivacy
    });

    if (submission.kind === 'no-changes') {
      showToast('Нет изменений');
      return;
    }

    if (!submission.selectionChanged && !submission.nameChanged && !submission.privacyChanged) {
      showToast('Нет изменений');
      return;
    }

    setTeamSettingsSaving(true);
    try {
      await apiFetch(`/api/teams/${shareId}`, {
        method: 'PATCH',
        body: JSON.stringify(submission.payload)
      });
      setBaseSelection((previous) =>
        submission.selectionChanged
          ? applySavedTeamSettingsState({
              baseSelection: previous,
              patchSelection: submission.patchSelection,
              calendarSelection
            })
          : previous
      );
      if (submission.nameChanged) {
        setTeamNameDraft(submission.trimmedName);
        setBaseName(submission.trimmedName);
      }
      if (submission.privacyChanged) {
        setPrivacyDraft(submission.normalizedPrivacy);
        setBasePrivacy(submission.normalizedPrivacy);
      }
      await loadTeamSettings();
      showToast('Настройки сохранены');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось сохранить настройки';
      showToast(message || 'Не удалось сохранить настройки');
    } finally {
      setTeamSettingsSaving(false);
    }
  }, [
    apiFetch,
    baseName,
    basePrivacy,
    baseSelection,
    calendarSelection,
    canEditName,
    canEditPrivacy,
    loadTeamSettings,
    privacyDraft,
    shareId,
    showToast,
    teamNameDraft
  ]);

  const handleTeamSlotRuleSave = useCallback(async () => {
    await slotRules.handleTeamSlotRuleSave();
    await loadTeamSettings();
  }, [loadTeamSettings, slotRules]);

  const handleTeamSlotRuleReset = useCallback(async () => {
    await slotRules.handleTeamSlotRuleReset();
    await loadTeamSettings();
  }, [loadTeamSettings, slotRules]);

  const handleDelete = useCallback(async () => {
    await executeTeamDeleteAction({
      shareId,
      confirmDelete: () => window.confirm(TEAM_DELETE_CONFIRMATION_MESSAGE),
      apiFetch,
      navigateHome,
      showToast
    });
  }, [apiFetch, navigateHome, shareId, showToast]);

  return {
    teamSettingsLoading,
    teamSettingsSaving,
    calendarSelection,
    canEditName,
    canEditPrivacy,
    canDelete,
    privacyDraft,
    setPrivacyDraft,
    teamNameDraft,
    setTeamNameDraft,
    handleSelectionChange,
    handleTeamSettingsSubmit,
    handleDelete,
    ...slotRules,
    handleTeamSlotRuleSave,
    handleTeamSlotRuleReset,
    ...webhooks
  };
}
