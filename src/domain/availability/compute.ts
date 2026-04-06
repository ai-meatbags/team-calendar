const DEFAULT_TIME_ZONE = 'Europe/Moscow';

function intersectIntervals(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  const start = new Date(Math.max(aStart.getTime(), bStart.getTime()));
  const end = new Date(Math.min(aEnd.getTime(), bEnd.getTime()));

  if (end <= start) {
    return null;
  }

  return { start, end };
}

function getTimeZoneParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second)
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = getTimeZoneParts(date, timeZone);
  const utcTime = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return utcTime - date.getTime();
}

function makeZonedDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string
) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const offset = getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
  return new Date(utcGuess - offset);
}

function getZonedDayStart(date: Date, timeZone: string) {
  const parts = getTimeZoneParts(date, timeZone);
  return makeZonedDate(parts.year, parts.month, parts.day, 0, 0, 0, timeZone);
}

function computeAvailableSlots(
  busyIntervals: Array<{ start: string; end: string }>,
  timeMin: Date,
  timeMax: Date,
  slotMinutes: number,
  options: {
    workdayStartHour?: number;
    workdayEndHour?: number;
    timeZone?: string;
  } = {}
) {
  const rangeStart = new Date(timeMin);
  const rangeEnd = new Date(timeMax);
  const slotMs = slotMinutes * 60 * 1000;
  const workdayStartHour = options.workdayStartHour ?? 9;
  const workdayEndHour = options.workdayEndHour ?? 18;
  const timeZone = options.timeZone || DEFAULT_TIME_ZONE;

  const busy = (busyIntervals || [])
    .map((interval) => ({
      start: new Date(interval.start),
      end: new Date(interval.end)
    }))
    .filter((interval) => interval.end > rangeStart && interval.start < rangeEnd)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const merged: Array<{ start: Date; end: Date }> = [];
  for (const interval of busy) {
    if (!merged.length) {
      merged.push({ ...interval });
      continue;
    }

    const last = merged[merged.length - 1];
    if (interval.start <= last.end) {
      if (interval.end > last.end) {
        last.end = interval.end;
      }
    } else {
      merged.push({ ...interval });
    }
  }

  const freeIntervals: Array<{ start: Date; end: Date }> = [];
  let cursor = rangeStart;
  for (const interval of merged) {
    if (interval.start > cursor) {
      freeIntervals.push({ start: cursor, end: interval.start });
    }
    if (interval.end > cursor) {
      cursor = interval.end;
    }
  }
  if (cursor < rangeEnd) {
    freeIntervals.push({ start: cursor, end: rangeEnd });
  }

  const slots: Array<{ start: string; end: string }> = [];
  let dayCursor = getZonedDayStart(rangeStart, timeZone);

  while (dayCursor < rangeEnd) {
    const dateParts = getTimeZoneParts(dayCursor, timeZone);
    const workStart = makeZonedDate(
      dateParts.year,
      dateParts.month,
      dateParts.day,
      workdayStartHour,
      0,
      0,
      timeZone
    );
    const workEnd = makeZonedDate(
      dateParts.year,
      dateParts.month,
      dateParts.day,
      workdayEndHour,
      0,
      0,
      timeZone
    );

    const dayWindow = intersectIntervals(workStart, workEnd, rangeStart, rangeEnd);
    if (dayWindow) {
      for (const free of freeIntervals) {
        const intersection = intersectIntervals(
          free.start,
          free.end,
          dayWindow.start,
          dayWindow.end
        );
        if (!intersection) {
          continue;
        }

        const dayStartMs = workStart.getTime();
        const offsetMs = Math.max(0, intersection.start.getTime() - dayStartMs);
        const firstSlotIndex = Math.ceil(offsetMs / slotMs);
        let t = dayStartMs + firstSlotIndex * slotMs;

        for (; t + slotMs <= intersection.end.getTime(); t += slotMs) {
          slots.push({
            start: new Date(t).toISOString(),
            end: new Date(t + slotMs).toISOString()
          });
        }
      }
    }

    dayCursor = new Date(dayCursor.getTime() + 24 * 60 * 60 * 1000);
  }

  return slots;
}

export function computeAvailabilitySlotsByMembers(params: {
  members: Array<{ memberPublicId: string; name: string; picture: string | null }>;
  busyIntervalsByMember: Array<Array<{ start: string; end: string }>>;
  timeMin: Date;
  timeMax: Date;
  slotMinutes: 30 | 60;
  options: {
    timeZone: string;
    workdayStartHour: number;
    workdayEndHour: number;
  };
}) {
  const memberList = Array.isArray(params.members) ? params.members : [];
  if (!memberList.length) {
    return [];
  }

  const slotMap = new Map<
    string,
    {
      start: string;
      end: string;
      members: Array<{ memberPublicId: string; name: string; picture: string | null }>;
      memberIds: Set<string>;
    }
  >();

  memberList.forEach((member, index) => {
    const busyIntervals = (params.busyIntervalsByMember && params.busyIntervalsByMember[index]) || [];
    const userSlots = computeAvailableSlots(
      busyIntervals,
      params.timeMin,
      params.timeMax,
      params.slotMinutes,
      params.options
    );

    userSlots.forEach((slot) => {
      const key = `${slot.start}|${slot.end}`;
      const existing = slotMap.get(key);
      if (existing) {
        if (!existing.memberIds.has(member.memberPublicId)) {
          existing.memberIds.add(member.memberPublicId);
          existing.members.push(member);
        }
      } else {
        slotMap.set(key, {
          start: slot.start,
          end: slot.end,
          members: [member],
          memberIds: new Set([member.memberPublicId])
        });
      }
    });
  });

  const requiredCount = memberList.length;

  return Array.from(slotMap.values())
    .filter((slot) => slot.members.length === requiredCount)
    .map(({ memberIds, ...slot }) => slot)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}
