import { formatDate } from './team-page-time';
import type { TeamAvailabilitySlot, TeamMember } from './team-page-types';

const TIME_ZONE = 'Europe/Moscow';

function getDateKey(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function getTimeZoneDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === 'year')?.value || 0);
  const month = Number(parts.find((part) => part.type === 'month')?.value || 0);
  const day = Number(parts.find((part) => part.type === 'day')?.value || 0);
  return { year, month, day };
}

function createUtcDateFromParts(parts: { year: number; month: number; day: number }) {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12));
}

function addUtcDays(date: Date, amount: number) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

export function getWeekStartDate(date: Date) {
  const localDate = createUtcDateFromParts(getTimeZoneDateParts(date));
  const dayOfWeek = localDate.getUTCDay();
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return addUtcDays(localDate, -offset);
}

export function getWeekNumber(date: Date) {
  const weekStart = getWeekStartDate(date);
  const yearStart = createUtcDateFromParts({ year: weekStart.getUTCFullYear(), month: 1, day: 4 });
  const firstWeekStart = getWeekStartDate(yearStart);
  const diffMs = weekStart.getTime() - firstWeekStart.getTime();
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
}

export function formatWeekRange(start: Date, end: Date) {
  const monthLabel = new Intl.DateTimeFormat('ru-RU', {
    timeZone: TIME_ZONE,
    month: 'long'
  }).format(start);
  const startDay = new Intl.DateTimeFormat('ru-RU', {
    timeZone: TIME_ZONE,
    day: 'numeric'
  }).format(start);
  const endDay = new Intl.DateTimeFormat('ru-RU', {
    timeZone: TIME_ZONE,
    day: 'numeric'
  }).format(end);

  const normalizedMonthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
  return `${normalizedMonthLabel}, ${startDay} - ${endDay}`;
}

export function groupSlotsByWeek(slots: TeamAvailabilitySlot[]) {
  const weeks = new Map<
    string,
    {
      key: string;
      label: string;
      weekNumber: number;
      isCurrentWeek: boolean;
      days: Array<{
        key: string;
        label: string;
        slots: Array<{ start: Date; end: Date; members?: TeamMember[] }>;
      }>;
    }
  >();
  const todayWeekKey = getDateKey(getWeekStartDate(new Date()));

  slots.forEach((slot) => {
    const start = new Date(slot.start);
    const weekStart = getWeekStartDate(start);
    const weekKey = getDateKey(weekStart);
    const dayKey = getDateKey(start);

    if (!weeks.has(weekKey)) {
      const weekEnd = addUtcDays(weekStart, 6);
      weeks.set(weekKey, {
        key: weekKey,
        label: formatWeekRange(weekStart, weekEnd),
        weekNumber: getWeekNumber(weekStart),
        isCurrentWeek: weekKey === todayWeekKey,
        days: []
      });
    }

    const week = weeks.get(weekKey);
    if (!week) {
      return;
    }

    let day = week.days.find((entry) => entry.key === dayKey);
    if (!day) {
      day = {
        key: dayKey,
        label: formatDate(start),
        slots: []
      };
      week.days.push(day);
    }

    day.slots.push({
      start,
      end: new Date(slot.end),
      members: slot.members || []
    });
  });

  return Array.from(weeks.values());
}
