import {
  applyTeamPageSelectionPatch,
  buildTeamPageSelectionPatch,
  hasTeamPageSelectionChanges
} from './team-page-query-state';
import { normalizeTeamPrivacy } from './team-page-members';
import type {
  CalendarSelectionItem,
  TeamMember,
  TeamWebhookDraftState,
  TeamWebhookProvisioning,
  TeamWebhookItem
} from './team-page-types';

export type ApiFetch = (path: string, options?: RequestInit) => Promise<unknown>;

export const TEAM_DELETE_CONFIRMATION_MESSAGE =
  'Удалить команду? Все участники будут удалены, действие необратимо.';

export function buildTeamPageSearchHref(
  pathname: string,
  searchParams: URLSearchParams | { toString(): string }
) {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export async function executeTeamJoinAction(params: {
  shareId: string;
  hasUser: boolean;
  openAuthPopup: () => void;
  apiFetch: ApiFetch;
  refresh: () => Promise<void>;
  showToast: (message: string) => void;
}) {
  if (!params.shareId) {
    return 'idle';
  }
  if (!params.hasUser) {
    params.openAuthPopup();
    return 'auth';
  }
  try {
    await params.apiFetch(`/api/teams/${params.shareId}/join`, { method: 'POST' });
    await params.refresh();
    return 'joined';
  } catch {
    params.showToast('Не удалось присоединиться');
    return 'error';
  }
}

export async function executeTeamDeleteAction(params: {
  shareId: string;
  confirmDelete: () => boolean;
  apiFetch: ApiFetch;
  navigateHome: () => void;
  showToast: (message: string) => void;
}) {
  if (!params.shareId) {
    return 'idle';
  }
  if (!params.confirmDelete()) {
    return 'cancelled';
  }
  try {
    await params.apiFetch(`/api/teams/${params.shareId}`, { method: 'DELETE' });
    params.navigateHome();
    return 'deleted';
  } catch {
    params.showToast('Не удалось удалить команду');
    return 'error';
  }
}

export async function executeTeamShareAction(params: {
  locationHref: string;
  writeClipboardText: (value: string) => Promise<void>;
  showToast: (message: string) => void;
  shareToastMessage: string;
}) {
  try {
    await params.writeClipboardText(params.locationHref);
    params.showToast(params.shareToastMessage || 'Ссылка скопирована');
    return 'shared';
  } catch {
    params.showToast('Не удалось скопировать ссылку');
    return 'error';
  }
}

export function resolveTeamBookingSubmission(params: {
  shareId: string;
  teamName: string;
  currentSlot: { start: string; end: string } | null;
  currentUserEmail?: string | null;
  formEmail?: string | null;
  comment?: string | null;
  isLoggedIn: boolean;
  selectionMode: 'all' | 'single';
  selectedMembers: TeamMember[];
}) {
  if (!params.currentSlot) {
    return { ok: false as const, message: 'Слот не выбран' };
  }

  const selectedMemberPublicIds = (params.selectedMembers || [])
    .map((member) => String(member?.memberPublicId || '').trim())
    .filter(Boolean);
  if (!selectedMemberPublicIds.length) {
    return { ok: false as const, message: 'Не удалось определить участников для бронирования' };
  }

  const email = params.isLoggedIn
    ? String(params.currentUserEmail || '').trim()
    : String(params.formEmail || '').trim();
  if (!email) {
    return {
      ok: false as const,
      message: params.isLoggedIn ? 'Не удалось определить почту пользователя' : 'Укажи почту'
    };
  }

  const slotStart = new Date(params.currentSlot.start);
  const slotEnd = new Date(params.currentSlot.end);
  if (Number.isNaN(slotStart.getTime()) || Number.isNaN(slotEnd.getTime())) {
    return { ok: false as const, message: 'Некорректный слот' };
  }

  return {
    ok: true as const,
    payload: {
      shareId: params.shareId,
      teamName: params.teamName || null,
      slotStart: slotStart.toISOString(),
      slotEnd: slotEnd.toISOString(),
      email,
      comment: String(params.comment || '').trim(),
      selectionMode: params.selectionMode,
      selectedMemberPublicIds
    }
  };
}

export function resolveTeamSettingsSubmission(params: {
  calendarSelection: Record<string, CalendarSelectionItem>;
  baseSelection: Record<string, CalendarSelectionItem>;
  teamNameDraft: string;
  baseName: string;
  canEditName: boolean;
  privacyDraft: string;
  basePrivacy: string;
  canEditPrivacy: boolean;
}) {
  const patchSelection = buildTeamPageSelectionPatch(params.calendarSelection);
  const trimmedName = params.teamNameDraft.trim();
  const nameChanged = params.canEditName && trimmedName !== params.baseName;
  const normalizedPrivacy = normalizeTeamPrivacy(params.privacyDraft);
  const privacyChanged = params.canEditPrivacy && normalizedPrivacy !== params.basePrivacy;
  const selectionChanged = hasTeamPageSelectionChanges(patchSelection, params.baseSelection);

  if (!nameChanged && !privacyChanged && !selectionChanged) {
    return { kind: 'no-changes' as const };
  }

  const payload: Record<string, unknown> = {};
  if (nameChanged) {
    payload.name = trimmedName;
  }
  if (privacyChanged) {
    payload.privacy = normalizedPrivacy;
  }
  if (selectionChanged) {
    payload.calendarSelection = patchSelection;
  }

  return {
    kind: 'submit' as const,
    payload,
    patchSelection,
    trimmedName,
    normalizedPrivacy,
    nameChanged,
    privacyChanged,
    selectionChanged
  };
}

export function applySavedTeamSettingsState(params: {
  baseSelection: Record<string, CalendarSelectionItem>;
  patchSelection: Record<string, { active: boolean }>;
  calendarSelection: Record<string, CalendarSelectionItem>;
}) {
  return applyTeamPageSelectionPatch(
    params.baseSelection,
    params.patchSelection,
    params.calendarSelection
  );
}

export function resolveTeamWebhookCreateSubmission(params: {
  targetUrl: string;
  provisioningToken?: string | null;
}) {
  const targetUrl = String(params.targetUrl || '').trim();
  if (!targetUrl) {
    return { ok: false as const, message: 'Укажи URL вебхука' };
  }

  const provisioningToken = String(params.provisioningToken || '').trim();
  if (!provisioningToken) {
    return { ok: false as const, message: 'Сначала сгенерируйте секрет' };
  }

  return {
    ok: true as const,
    payload: {
      targetUrl,
      provisioningToken
    }
  };
}

export async function executeTeamWebhookPrepareAction(params: {
  shareId: string;
  apiFetch: ApiFetch;
}) {
  return (await params.apiFetch(`/api/teams/${params.shareId}/integrations/webhooks/prepare`, {
    method: 'POST'
  })) as { provisioning?: TeamWebhookDraftState };
}

export async function executeTeamWebhookCreateAction(params: {
  shareId: string;
  targetUrl: string;
  provisioningToken?: string | null;
  apiFetch: ApiFetch;
}) {
  const submission = resolveTeamWebhookCreateSubmission({
    targetUrl: params.targetUrl,
    provisioningToken: params.provisioningToken
  });
  if (!submission.ok) {
    throw new Error(submission.message);
  }

  return (await params.apiFetch(`/api/teams/${params.shareId}/integrations/webhooks`, {
    method: 'POST',
    body: JSON.stringify(submission.payload)
  })) as { webhook?: TeamWebhookItem };
}

export async function executeTeamWebhookToggleAction(params: {
  shareId: string;
  webhookId: string;
  isActive: boolean;
  apiFetch: ApiFetch;
}) {
  return (await params.apiFetch(
    `/api/teams/${params.shareId}/integrations/webhooks/${params.webhookId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ isActive: params.isActive })
    }
  )) as { webhook?: TeamWebhookItem };
}

export async function executeTeamWebhookDeleteAction(params: {
  shareId: string;
  webhookId: string;
  apiFetch: ApiFetch;
}) {
  return (await params.apiFetch(
    `/api/teams/${params.shareId}/integrations/webhooks/${params.webhookId}`,
    {
      method: 'DELETE'
    }
  )) as { deleted?: boolean };
}

export async function executeTeamWebhookRotateAction(params: {
  shareId: string;
  webhookId: string;
  apiFetch: ApiFetch;
}) {
  return (await params.apiFetch(
    `/api/teams/${params.shareId}/integrations/webhooks/${params.webhookId}/rotate`,
    {
      method: 'POST'
    }
  )) as { webhook?: TeamWebhookItem; provisioning?: TeamWebhookProvisioning };
}
