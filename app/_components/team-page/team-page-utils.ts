import {
  canRenderJoinButton,
  getMemberDisplayName,
  getMemberStableKey,
  normalizeTeamPrivacy
} from '@/shared/team-ui.js';

export const DEFAULT_DURATION_MINUTES = 60;
const TIME_ZONE = 'Europe/Moscow';

export type TeamMember = {
  id?: string | null;
  name?: string | null;
  picture?: string | null;
  memberPublicId?: string | null;
};

export type CalendarSelectionItem = {
  id?: string;
  title?: string;
  summary?: string;
  active?: boolean;
};

export type TeamWebhookItem = {
  id?: string | null;
  eventType?: string | null;
  targetUrl?: string | null;
  status?: string | null;
  isActive?: boolean | null;
  lastDeliveryStatus?: string | null;
  lastDeliveryAt?: string | null;
  lastError?: string | null;
};

export function parseDurationQuery(rawDuration: unknown) {
  const value = String(rawDuration || '').trim();
  if (value === '30') {
    return 30;
  }
  if (value === '60') {
    return 60;
  }
  return null;
}

export function normalizeDurationQuery(rawDuration: unknown, fallback = DEFAULT_DURATION_MINUTES) {
  const parsedDuration = parseDurationQuery(rawDuration);
  if (parsedDuration !== null) {
    return { value: parsedDuration, isValid: true };
  }
  return { value: fallback, isValid: false };
}

export function resolveMemberQuery(rawMemberQuery: unknown, members: TeamMember[]) {
  const memberQuery = String(rawMemberQuery || '').trim();
  if (!memberQuery) {
    return {
      selectedMemberPublicId: null,
      isValid: true
    };
  }

  const list = Array.isArray(members) ? members : [];
  const isValid = list.some(
    (member) => String(member?.memberPublicId || '').trim() === memberQuery
  );

  return {
    selectedMemberPublicId: isValid ? memberQuery : null,
    isValid
  };
}

export function patchSearchParams(
  prevSearchParams: URLSearchParams | { toString(): string },
  patchFn: (next: URLSearchParams) => void
) {
  const previous = prevSearchParams.toString();
  const next = new URLSearchParams(previous);
  patchFn(next);
  return next.toString() === previous ? prevSearchParams : next;
}

export function buildTeamPageSelectionPatch(selection: Record<string, CalendarSelectionItem>) {
  const patch: Record<string, { active: boolean }> = {};
  Object.keys(selection || {}).forEach((id) => {
    patch[id] = { active: Boolean(selection[id]?.active) };
  });
  return patch;
}

export function hasTeamPageSelectionChanges(
  patchSelection: Record<string, { active: boolean }>,
  baseSelection: Record<string, CalendarSelectionItem>
) {
  const base = baseSelection || {};
  const entries = Object.entries(patchSelection || {});
  if (entries.length !== Object.keys(base).length) {
    return true;
  }

  return entries.some(([id, payload]) => {
    const baseItem = base[id];
    if (!baseItem) {
      return true;
    }
    return Boolean(payload?.active) !== Boolean(baseItem.active);
  });
}

export function applyTeamPageSelectionPatch(
  baseSelection: Record<string, CalendarSelectionItem>,
  patchSelection: Record<string, { active: boolean }>,
  currentSelection: Record<string, CalendarSelectionItem>
) {
  const updated = { ...(baseSelection || {}) };
  Object.entries(patchSelection || {}).forEach(([id, value]) => {
    updated[id] = {
      ...(updated[id] || currentSelection?.[id] || {}),
      active: value.active
    };
  });
  return updated;
}

export { normalizeTeamPrivacy, canRenderJoinButton, getMemberDisplayName, getMemberStableKey };

export function formatTeamWebhookStateLabel(webhook: TeamWebhookItem) {
  return webhook.isActive ? 'Активен' : 'Выключен';
}

export function formatTeamWebhookDeliveryLabel(webhook: TeamWebhookItem) {
  if (!webhook.isActive) {
    return 'Отправка отключена';
  }

  if (webhook.lastDeliveryStatus === 'success') {
    return 'Последняя доставка успешна';
  }

  if (webhook.lastDeliveryStatus === 'failed') {
    return 'Последняя доставка завершилась ошибкой';
  }

  return 'Ещё не отправлялся';
}

export function formatDate(date: Date) {
  const datePart = new Intl.DateTimeFormat('ru-RU', {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: 'short'
  }).format(date);
  const weekdayPart = new Intl.DateTimeFormat('ru-RU', {
    timeZone: TIME_ZONE,
    weekday: 'long'
  }).format(date);
  return `${datePart}, ${weekdayPart}`;
}

export function formatTime(date: Date) {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

export function formatHour(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`;
}

export function getDateKey(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function pluralizeRu(count: number, forms: [string, string, string]) {
  const value = Math.abs(count);
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return forms[0];
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return forms[1];
  }
  return forms[2];
}

export function formatCount(count: number, forms: [string, string, string]) {
  return `${count} ${pluralizeRu(count, forms)}`;
}

export function buildTeamPageShareToastMessage(selectedMemberName: string, duration: number) {
  const durationToastTail = duration === 30 ? 'на 30 минут' : 'на 1 час';
  return selectedMemberName
    ? `Скопирована ссылка на расписание участника ${selectedMemberName} ${durationToastTail}`
    : `Скопирована ссылка на расписание всей команды ${durationToastTail}`;
}
