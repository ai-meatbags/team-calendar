import {
  DEFAULT_DURATION_MINUTES,
  type CalendarSelectionItem,
  type TeamMember
} from './team-page-types';

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
