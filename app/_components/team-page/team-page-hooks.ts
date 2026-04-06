'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  DEFAULT_DURATION_MINUTES,
  formatTeamWebhookDeliveryLabel,
  formatTeamWebhookStateLabel,
  normalizeDurationQuery,
  normalizeTeamPrivacy,
  patchSearchParams,
  resolveMemberQuery,
  type CalendarSelectionItem,
  type TeamMember,
  type TeamWebhookItem
} from './team-page-utils';
import {
  applySavedTeamSettingsState,
  buildTeamPageSearchHref,
  executeTeamDeleteAction,
  executeTeamJoinAction,
  executeTeamShareAction,
  executeTeamWebhookCreateAction,
  executeTeamWebhookDeleteAction,
  executeTeamWebhookToggleAction,
  resolveTeamBookingSubmission,
  resolveTeamSettingsSubmission,
  TEAM_DELETE_CONFIRMATION_MESSAGE
} from './team-page-state';
import type { ApiFetch } from './team-page-state';

type TeamPageResponse = {
  team?: {
    name?: string;
    shareId?: string;
    privacy?: string;
  };
  members?: TeamMember[];
  isMember?: boolean;
  isOwner?: boolean;
  canJoin?: boolean;
};

type TeamSettingsResponse = {
  team?: {
    name?: string;
    shareId?: string;
  };
  canEditName?: boolean;
  canEditPrivacy?: boolean;
  canDelete?: boolean;
  privacy?: string;
  calendarSelection?: Record<string, CalendarSelectionItem>;
};

type TeamWebhooksResponse = {
  webhooks?: TeamWebhookItem[];
};

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

const DEFAULT_TEAM_PAGE_SUMMARY = Object.freeze({
  days: 14,
  workdayStartHour: 10,
  workdayEndHour: 20,
  minNoticeHours: 12
});

function getAvailabilityErrorMessage(error: unknown) {
  const fallbackMessage = 'Не удалось загрузить слоты';
  const rawMessage = String(
    error && typeof error === 'object' && 'message' in error
      ? (error as { message?: unknown }).message
      : ''
  ).trim();
  if (!rawMessage) {
    return fallbackMessage;
  }
  return rawMessage.replace(/[.!?]+$/, '').trim() || fallbackMessage;
}

export function useTeamPageCore({ shareId, apiFetch }: { shareId: string; apiFetch: ApiFetch }) {
  const [teamData, setTeamData] = useState<TeamPageResponse | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamNameDraft, setTeamNameDraft] = useState('');
  const [baseName, setBaseName] = useState('');
  const [notFound, setNotFound] = useState(false);

  const applyTeamName = useCallback((name: string) => {
    setTeamName(name);
    setTeamNameDraft(name);
    setBaseName(name);
  }, []);

  const loadTeam = useCallback(async () => {
    if (!shareId) {
      return;
    }
    try {
      const data = (await apiFetch(`/api/teams/${shareId}`)) as TeamPageResponse;
      setTeamData(data);
      const name = data.team?.name || '';
      applyTeamName(name);
      setNotFound(false);
    } catch {
      setNotFound(true);
    }
  }, [apiFetch, applyTeamName, shareId]);

  const refresh = useCallback(async () => {
    await loadTeam();
  }, [loadTeam]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    teamData,
    teamName,
    teamNameDraft,
    baseName,
    setTeamNameDraft,
    applyTeamName,
    refresh,
    notFound
  };
}

function useMutableTeamSearchParams() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  const setTeamSearchParams = useCallback(
    (patchFn: (next: URLSearchParams) => void, options?: { replace?: boolean }) => {
      const next = patchSearchParams(searchParams, patchFn);
      if (next === searchParams) {
        return;
      }

      const href = buildTeamPageSearchHref(pathname, next as URLSearchParams);
      if (options?.replace) {
        router.replace(href);
        return;
      }
      router.push(href);
    },
    [pathname, router, searchParams]
  );

  return {
    searchParams,
    searchKey,
    setTeamSearchParams
  };
}

export function useDurationFilter() {
  const { searchParams, searchKey, setTeamSearchParams } = useMutableTeamSearchParams();
  const rawDuration = searchParams.get('duration');

  const { value: duration, isValid } = useMemo(
    () => normalizeDurationQuery(rawDuration, DEFAULT_DURATION_MINUTES),
    [rawDuration]
  );

  useEffect(() => {
    if (isValid && rawDuration === String(duration)) {
      return;
    }

    setTeamSearchParams((next) => {
      next.set('duration', String(duration));
    }, { replace: true });
  }, [duration, isValid, rawDuration, searchKey, setTeamSearchParams]);

  const setDuration = useCallback((nextDuration: unknown) => {
    const normalized = normalizeDurationQuery(nextDuration, duration);
    setTeamSearchParams((next) => {
      next.set('duration', String(normalized.value));
    });
  }, [duration, setTeamSearchParams]);

  return {
    duration,
    setDuration
  };
}

export function useMemberFilter({
  members,
  isEnabled
}: {
  members: TeamMember[];
  isEnabled: boolean;
}) {
  const { searchParams, searchKey, setTeamSearchParams } = useMutableTeamSearchParams();
  const rawMemberQuery = searchParams.get('member');

  const { selectedMemberPublicId, isValid } = useMemo(
    () => resolveMemberQuery(rawMemberQuery, members),
    [members, rawMemberQuery]
  );

  useEffect(() => {
    if (!isEnabled || !rawMemberQuery || isValid) {
      return;
    }

    setTeamSearchParams((next) => {
      next.delete('member');
    }, { replace: true });
  }, [isEnabled, isValid, rawMemberQuery, searchKey, setTeamSearchParams]);

  const setMemberFilter = useCallback((memberPublicId: string | null) => {
    const normalizedId = String(memberPublicId || '').trim();
    setTeamSearchParams((next) => {
      if (normalizedId) {
        next.set('member', normalizedId);
        return;
      }
      next.delete('member');
    });
  }, [setTeamSearchParams]);

  return {
    selectedMemberPublicId,
    setMemberFilter
  };
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
  const [settingsSummary, setSettingsSummary] = useState<AvailabilityResponse | typeof DEFAULT_TEAM_PAGE_SUMMARY>(
    () => DEFAULT_TEAM_PAGE_SUMMARY
  );
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [slotsStatus, setSlotsStatus] = useState('');

  const loadAvailability = useCallback(async () => {
    if (!shareId) {
      return;
    }

    setIsSlotsLoading(true);
    setSlotsStatus('');
    try {
      const query = new URLSearchParams({
        duration: String(duration)
      });
      if (selectedMemberPublicId) {
        query.set('member', selectedMemberPublicId);
      }
      const data = (await apiFetch(`/api/teams/${shareId}/availability?${query.toString()}`)) as AvailabilityResponse;
      setSlots(data.slots || []);
      setSettingsSummary(data || DEFAULT_TEAM_PAGE_SUMMARY);
      setSlotsStatus('');
    } catch (error) {
      setSlots([]);
      setSlotsStatus(getAvailabilityErrorMessage(error));
    } finally {
      setIsSlotsLoading(false);
    }
  }, [apiFetch, duration, selectedMemberPublicId, shareId]);

  useEffect(() => {
    if (isEnabled) {
      void loadAvailability();
    }
  }, [isEnabled, loadAvailability]);

  return {
    slots,
    settingsSummary,
    isSlotsLoading,
    slotsStatus,
    refreshAvailability: loadAvailability,
    setSlotsStatus
  };
}

export function useTeamPageBooking({
  shareId,
  teamName,
  apiFetch,
  showToast,
  currentUser,
  selectionMode,
  selectedMembers
}: {
  shareId: string;
  teamName: string;
  apiFetch: ApiFetch;
  showToast: (message: string) => void;
  currentUser: { email?: string | null } | null;
  selectionMode: 'all' | 'single';
  selectedMembers: TeamMember[];
}) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [currentSlot, setCurrentSlot] = useState<AvailabilitySlot | null>(null);
  const [bookingState, setBookingState] = useState<'editing' | 'submitting' | 'success' | 'error'>('editing');
  const [formValues, setFormValues] = useState({ email: '', comment: '' });
  const isLoggedIn = Boolean(currentUser);

  const openSlot = useCallback((slot: AvailabilitySlot) => {
    setCurrentSlot(slot);
    setBookingOpen(true);
    setBookingState('editing');
    setFormValues({ email: '', comment: '' });
  }, []);

  const closeBooking = useCallback(() => {
    setBookingOpen(false);
    setCurrentSlot(null);
    setBookingState('editing');
    setFormValues({ email: '', comment: '' });
  }, []);

  const handleFieldChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormValues((previous) => ({
      ...previous,
      [name]: value
    }));
    setBookingState((previous) => (previous === 'error' ? 'editing' : previous));
  }, []);

  const handleBookingSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submission = resolveTeamBookingSubmission({
      shareId,
      teamName,
      currentSlot,
      currentUserEmail: currentUser?.email,
      formEmail: formValues.email,
      comment: formValues.comment,
      isLoggedIn,
      selectionMode,
      selectedMembers
    });
    if (!submission.ok) {
      showToast(submission.message);
      return;
    }

    setBookingState('submitting');
    try {
      await apiFetch('/api/booking', {
        method: 'POST',
        body: JSON.stringify(submission.payload)
      });
      setBookingState('success');
    } catch {
      setBookingState('error');
      showToast('Не удалось отправить запрос');
    }
  }, [
    apiFetch,
    currentSlot,
    currentUser?.email,
    formValues.comment,
    formValues.email,
    isLoggedIn,
    selectedMembers,
    selectionMode,
    shareId,
    showToast,
    teamName
  ]);

  return {
    bookingOpen,
    currentSlot,
    bookingState,
    isSubmitting: bookingState === 'submitting',
    isSuccess: bookingState === 'success',
    isLoggedIn,
    targetMembers: selectedMembers || [],
    selectionMode,
    teamName,
    formValues,
    openSlot,
    closeBooking,
    handleBookingSubmit,
    handleFieldChange
  };
}

export function useTeamPageSettings({
  shareId,
  apiFetch,
  showToast,
  onTeamNameUpdated,
  onSettingsSaved
}: {
  shareId: string;
  apiFetch: ApiFetch;
  showToast: (message: string) => void;
  onTeamNameUpdated?: (name: string) => void;
  onSettingsSaved?: () => void;
}) {
  const [teamSettingsOpen, setTeamSettingsOpen] = useState(false);
  const [teamSettingsLoading, setTeamSettingsLoading] = useState(false);
  const [teamSettingsSaving, setTeamSettingsSaving] = useState(false);
  const [teamSettingsStatus, setTeamSettingsStatus] = useState('');
  const [calendarSelection, setCalendarSelection] = useState<Record<string, CalendarSelectionItem>>({});
  const [baseSelection, setBaseSelection] = useState<Record<string, CalendarSelectionItem>>({});
  const [teamNameDraft, setTeamNameDraft] = useState('');
  const [baseName, setBaseName] = useState('');
  const [canEditName, setCanEditName] = useState(false);
  const [canEditPrivacy, setCanEditPrivacy] = useState(false);
  const [privacyDraft, setPrivacyDraft] = useState('public');
  const [basePrivacy, setBasePrivacy] = useState('public');
  const [canDelete, setCanDelete] = useState(false);
  const [webhooks, setWebhooks] = useState<TeamWebhookItem[]>([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [webhookActionStatus, setWebhookActionStatus] = useState('');
  const [webhookActionPendingId, setWebhookActionPendingId] = useState<string | null>(null);
  const [webhookActionMode, setWebhookActionMode] = useState<'add' | 'toggle' | 'delete' | null>(null);

  const loadTeamSettings = useCallback(async () => {
    if (!shareId) {
      return;
    }
    setTeamSettingsLoading(true);
    setTeamSettingsStatus('Загружаем настройки...');
    try {
      const data = (await apiFetch(`/api/teams/${shareId}/settings`)) as TeamSettingsResponse;
      setCanEditName(Boolean(data.canEditName));
      setCanEditPrivacy(Boolean(data.canEditPrivacy));
      setCanDelete(Boolean(data.canDelete));
      const name = data.team?.name || '';
      const privacy = normalizeTeamPrivacy(data.privacy);
      setTeamNameDraft(name);
      setBaseName(name);
      setPrivacyDraft(privacy);
      setBasePrivacy(privacy);
      onTeamNameUpdated?.(name);
      setCalendarSelection(data.calendarSelection || {});
      setBaseSelection(data.calendarSelection || {});
      if (data.canDelete) {
        const webhooksData = (await apiFetch(
          `/api/teams/${shareId}/integrations/webhooks`
        )) as TeamWebhooksResponse;
        setWebhooks(webhooksData.webhooks || []);
      } else {
        setWebhooks([]);
      }
      setNewWebhookUrl('');
      setWebhookActionStatus('');
      setTeamSettingsStatus('');
    } catch {
      showToast('Не удалось загрузить настройки команды');
      setTeamSettingsStatus('');
    } finally {
      setTeamSettingsLoading(false);
    }
  }, [apiFetch, onTeamNameUpdated, shareId, showToast]);

  useEffect(() => {
    if (teamSettingsOpen) {
      void loadTeamSettings();
    }
  }, [loadTeamSettings, teamSettingsOpen]);

  const handleSelectionChange = useCallback((id: string, value: CalendarSelectionItem) => {
    setCalendarSelection((prev) => ({
      ...prev,
      [id]: value
    }));
  }, []);

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

    setTeamSettingsSaving(true);
    setTeamSettingsStatus('Сохраняем...');
    try {
      await apiFetch(`/api/teams/${shareId}`, {
        method: 'PATCH',
        body: JSON.stringify(submission.payload)
      });
      if (submission.nameChanged) {
        setTeamNameDraft(submission.trimmedName);
        setBaseName(submission.trimmedName);
        onTeamNameUpdated?.(submission.trimmedName);
      }
      if (submission.privacyChanged) {
        setPrivacyDraft(submission.normalizedPrivacy);
        setBasePrivacy(submission.normalizedPrivacy);
      }
      if (submission.selectionChanged) {
        setBaseSelection((prev) =>
          applySavedTeamSettingsState({
            baseSelection: prev,
            patchSelection: submission.patchSelection,
            calendarSelection
          })
        );
      }
      showToast('Настройки сохранены');
      onSettingsSaved?.();
      setTeamSettingsStatus('');
      setTeamSettingsOpen(false);
    } catch (error) {
      const message = String(
        error && typeof error === 'object' && 'message' in error
          ? (error as { message?: unknown }).message || ''
          : ''
      ).trim() || 'Не удалось сохранить настройки';
      showToast(message);
      setTeamSettingsStatus(message);
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
    onSettingsSaved,
    onTeamNameUpdated,
    privacyDraft,
    shareId,
    showToast,
    teamNameDraft
  ]);

  const handleWebhookAdd = useCallback(async () => {
    if (!shareId) {
      return;
    }

    setWebhookActionMode('add');
    setWebhookActionPendingId(null);
    setWebhookActionStatus('Добавляем вебхук...');
    try {
      const payload = await executeTeamWebhookCreateAction({
        shareId,
        targetUrl: newWebhookUrl,
        apiFetch
      });
      if (payload.webhook) {
        setWebhooks((prev) => [...prev, payload.webhook as TeamWebhookItem]);
      }
      setNewWebhookUrl('');
      setWebhookActionStatus('');
      showToast('Вебхук добавлен');
    } catch (error) {
      const message = String(
        error && typeof error === 'object' && 'message' in error
          ? (error as { message?: unknown }).message || ''
          : ''
      ).trim() || 'Не удалось добавить вебхук';
      setWebhookActionStatus(message);
      showToast(message);
    } finally {
      setWebhookActionMode(null);
      setWebhookActionPendingId(null);
    }
  }, [apiFetch, newWebhookUrl, shareId, showToast]);

  const handleWebhookToggle = useCallback(async (webhookId: string, isActive: boolean) => {
    if (!shareId || !webhookId) {
      return;
    }

    setWebhookActionMode('toggle');
    setWebhookActionPendingId(webhookId);
    setWebhookActionStatus('');
    try {
      const payload = await executeTeamWebhookToggleAction({
        shareId,
        webhookId,
        isActive,
        apiFetch
      });
      if (payload.webhook) {
        setWebhooks((prev) =>
          prev.map((webhook) => (webhook.id === webhookId ? (payload.webhook as TeamWebhookItem) : webhook))
        );
      }
    } catch (error) {
      const message = String(
        error && typeof error === 'object' && 'message' in error
          ? (error as { message?: unknown }).message || ''
          : ''
      ).trim() || 'Не удалось обновить вебхук';
      setWebhookActionStatus(message);
      showToast(message);
    } finally {
      setWebhookActionMode(null);
      setWebhookActionPendingId(null);
    }
  }, [apiFetch, shareId, showToast]);

  const handleWebhookDelete = useCallback(async (webhookId: string) => {
    if (!shareId || !webhookId) {
      return;
    }

    setWebhookActionMode('delete');
    setWebhookActionPendingId(webhookId);
    setWebhookActionStatus('');
    try {
      await executeTeamWebhookDeleteAction({
        shareId,
        webhookId,
        apiFetch
      });
      setWebhooks((prev) => prev.filter((webhook) => webhook.id !== webhookId));
      showToast('Вебхук удалён');
    } catch (error) {
      const message = String(
        error && typeof error === 'object' && 'message' in error
          ? (error as { message?: unknown }).message || ''
          : ''
      ).trim() || 'Не удалось удалить вебхук';
      setWebhookActionStatus(message);
      showToast(message);
    } finally {
      setWebhookActionMode(null);
      setWebhookActionPendingId(null);
    }
  }, [apiFetch, shareId, showToast]);

  return {
    teamSettingsOpen,
    setTeamSettingsOpen,
    teamSettingsLoading,
    teamSettingsSaving,
    teamSettingsStatus,
    calendarSelection,
    canEditName,
    canEditPrivacy,
    canDelete,
    webhooks,
    newWebhookUrl,
    setNewWebhookUrl,
    webhookActionStatus,
    webhookActionPendingId,
    webhooksBusy: webhookActionMode !== null,
    privacyDraft,
    setPrivacyDraft,
    teamNameDraft,
    setTeamNameDraft,
    handleWebhookAdd,
    handleWebhookToggle,
    handleWebhookDelete,
    formatTeamWebhookStateLabel,
    formatTeamWebhookDeliveryLabel,
    handleSelectionChange,
    handleTeamSettingsSubmit
  };
}

export function useTeamPageActions({
  shareId,
  hasUser,
  openAuthPopup,
  apiFetch,
  showToast,
  shareToastMessage,
  refresh,
  navigateHome
}: {
  shareId: string;
  hasUser: boolean;
  openAuthPopup: () => void;
  apiFetch: ApiFetch;
  showToast: (message: string) => void;
  shareToastMessage: string;
  refresh: () => Promise<void>;
  navigateHome: () => void;
}) {
  const handleJoin = useCallback(async () => {
    await executeTeamJoinAction({
      shareId,
      hasUser,
      openAuthPopup,
      apiFetch,
      refresh,
      showToast
    });
  }, [apiFetch, hasUser, openAuthPopup, refresh, shareId, showToast]);

  const handleDelete = useCallback(async () => {
    await executeTeamDeleteAction({
      shareId,
      confirmDelete: () => window.confirm(TEAM_DELETE_CONFIRMATION_MESSAGE),
      apiFetch,
      navigateHome,
      showToast
    });
  }, [apiFetch, navigateHome, shareId, showToast]);

  const handleShare = useCallback(async () => {
    await executeTeamShareAction({
      locationHref: window.location.href,
      writeClipboardText: (value) => navigator.clipboard.writeText(value),
      showToast,
      shareToastMessage
    });
  }, [shareToastMessage, showToast]);

  return {
    handleJoin,
    handleDelete,
    handleShare
  };
}
