export type CalendarSelectionEntry = {
  id?: string;
  title?: string;
  active: boolean;
};

export type CalendarSelection = Record<string, CalendarSelectionEntry>;

type CalendarListItem = {
  id?: string | null;
  summary?: string | null;
  primary?: boolean | null;
};

type SelectionError = Error & { status?: number };

function createSelectionError(message: string, status?: number) {
  const error = new Error(message) as SelectionError;
  error.status = status;
  return error;
}

export function parseCalendarSelectionStrict(value: unknown): {
  selection: CalendarSelection | null;
  error: SelectionError | null;
} {
  if (value === undefined || value === null || value === '') {
    return { selection: {}, error: null };
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return { selection: value as CalendarSelection, error: null };
  }

  try {
    const parsed = JSON.parse(String(value));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {
        selection: null,
        error: createSelectionError('Invalid calendar selection payload')
      };
    }

    return { selection: parsed as CalendarSelection, error: null };
  } catch {
    return {
      selection: null,
      error: createSelectionError('Invalid calendar selection JSON')
    };
  }
}

export function parseCalendarSelection(value: unknown): CalendarSelection {
  const parsed = parseCalendarSelectionStrict(value);
  return parsed.selection || {};
}

export function mergeCalendarSelection(
  items: CalendarListItem[],
  baseSelection: CalendarSelection | null | undefined
): CalendarSelection {
  const selection: CalendarSelection = {};
  const base = baseSelection || {};

  for (const item of items || []) {
    const calendarId = String(item?.id || '').trim();
    if (!calendarId) {
      continue;
    }

    selection[calendarId] = {
      id: calendarId,
      title: String(item?.summary || calendarId),
      active: Boolean(base[calendarId]?.active)
    };
  }

  return selection;
}

export function applyCalendarSelectionPatch(
  items: CalendarListItem[],
  baseSelection: CalendarSelection | null | undefined,
  patchSelection: unknown
): {
  selection: CalendarSelection | null;
  error: SelectionError | null;
} {
  if (!patchSelection || typeof patchSelection !== 'object' || Array.isArray(patchSelection)) {
    return {
      selection: null,
      error: createSelectionError('Invalid calendar selection payload', 400)
    };
  }

  const selection = mergeCalendarSelection(items, baseSelection);
  for (const [calendarId, payload] of Object.entries(patchSelection as Record<string, unknown>)) {
    if (!selection[calendarId]) {
      return {
        selection: null,
        error: createSelectionError('Unknown calendar id', 400)
      };
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return {
        selection: null,
        error: createSelectionError('Invalid calendar selection payload', 400)
      };
    }

    const keys = Object.keys(payload);
    const active = (payload as { active?: unknown }).active;
    if (keys.length !== 1 || keys[0] !== 'active' || typeof active !== 'boolean') {
      return {
        selection: null,
        error: createSelectionError('Invalid calendar selection payload', 400)
      };
    }

    selection[calendarId] = {
      ...selection[calendarId],
      active
    };
  }

  return { selection, error: null };
}

export function resolveSelectionSource(
  teamSelectionValue: unknown,
  defaultSelectionValue: unknown
) {
  const hasTeamSelection =
    teamSelectionValue !== undefined && teamSelectionValue !== null && teamSelectionValue !== '';

  return {
    selectionValue: hasTeamSelection ? teamSelectionValue : defaultSelectionValue,
    source: hasTeamSelection ? 'team' : 'default'
  };
}

export function listActiveCalendarIds(selectionValue: unknown) {
  const selection = parseCalendarSelection(selectionValue);
  return Object.entries(selection)
    .filter(([, value]) => Boolean(value?.active))
    .map(([calendarId]) => calendarId);
}

export function listActiveCalendarIdsOrPrimary(selectionValue: unknown) {
  const active = listActiveCalendarIds(selectionValue);
  if (!active.length) {
    return ['primary'];
  }
  return active;
}
