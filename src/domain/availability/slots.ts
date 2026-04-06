const DAY_MS = 24 * 60 * 60 * 1000;

export interface BuildSlotsInput {
  timeMin: Date;
  timeMax: Date;
  slotMinutes: 30 | 60;
  workdayStartHour: number;
  workdayEndHour: number;
  timeZone: string;
  members: Array<{ memberPublicId: string; name: string; picture: string | null }>;
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
    day: Number(map.day)
  };
}

function getOffsetMs(date: Date, timeZone: string) {
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
  const utcLike = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );
  return utcLike - date.getTime();
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
  const offset = getOffsetMs(new Date(utcGuess), timeZone);
  return new Date(utcGuess - offset);
}

export function buildAvailabilitySlots(input: BuildSlotsInput) {
  const slots: Array<{
    start: string;
    end: string;
    members: Array<{ memberPublicId: string; name: string; picture: string | null }>;
  }> = [];

  const slotMs = input.slotMinutes * 60 * 1000;
  let cursor = new Date(input.timeMin.getTime());

  while (cursor < input.timeMax) {
    const parts = getTimeZoneParts(cursor, input.timeZone);
    const start = makeZonedDate(
      parts.year,
      parts.month,
      parts.day,
      input.workdayStartHour,
      0,
      0,
      input.timeZone
    );
    const end = makeZonedDate(
      parts.year,
      parts.month,
      parts.day,
      input.workdayEndHour,
      0,
      0,
      input.timeZone
    );

    const rangeStart = Math.max(start.getTime(), input.timeMin.getTime());
    const rangeEnd = Math.min(end.getTime(), input.timeMax.getTime());

    for (let t = rangeStart; t + slotMs <= rangeEnd; t += slotMs) {
      slots.push({
        start: new Date(t).toISOString(),
        end: new Date(t + slotMs).toISOString(),
        members: input.members
      });
    }

    cursor = new Date(cursor.getTime() + DAY_MS);
  }

  return slots;
}
