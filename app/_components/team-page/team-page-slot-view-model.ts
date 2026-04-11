import { formatDate } from './team-page-time';
import type { TeamMember } from './team-page-types';

const TIME_ZONE = 'Europe/Moscow';

export type SlotViewMode = 'list' | 'week';
export type SlotsViewportMode = 'auto' | 'desktop' | 'mobile';

export type SlotCardValue = {
  start: Date;
  end: Date;
  members?: TeamMember[];
};

export type SlotDayGroup = {
  key: string;
  label: string;
  slots: SlotCardValue[];
};

export type SlotWeekGroup = {
  key: string;
  label: string;
  weekNumber: number;
  isCurrentWeek: boolean;
  days: SlotDayGroup[];
};

export type WeekGridDay = SlotDayGroup & {
  title: string;
  weekday: string;
  isEmpty: boolean;
};

export type WeekGridTimeline = {
  startHour: number;
  endHour: number;
  rowCount: number;
};

export type WeekGridPlacedSlot = SlotCardValue & {
  rowStart: number;
  rowEnd: number;
};

function addUtcDays(date: Date, amount: number) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

function splitDayLabel(label: string) {
  const [title, ...rest] = label.split(', ');
  return {
    title: title || label,
    weekday: rest.join(', ')
  };
}

export function buildWeekGridDays(week: SlotWeekGroup): WeekGridDay[] {
  const daysByKey = new Map(week.days.map((day) => [day.key, day]));
  const weekStart = new Date(`${week.key}T12:00:00.000Z`);

  return Array.from({ length: 7 }, (_, index) => {
    const date = addUtcDays(weekStart, index);
    const key = date.toISOString().slice(0, 10);
    const day = daysByKey.get(key);
    const label = day?.label || formatDate(date);
    const parts = splitDayLabel(label);

    return {
      key,
      label,
      slots: day?.slots || [],
      title: parts.title,
      weekday: parts.weekday,
      isEmpty: !day?.slots.length
    };
  });
}

function getTimeParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(date);

  return {
    hour: Number(parts.find((part) => part.type === 'hour')?.value || 0),
    minute: Number(parts.find((part) => part.type === 'minute')?.value || 0)
  };
}

export function buildWeekGridTimeline(params: {
  workdayStartHour?: number;
  workdayEndHour?: number;
  weeks: SlotWeekGroup[];
}): WeekGridTimeline {
  const allSlots = params.weeks.flatMap((week) => week.days.flatMap((day) => day.slots));

  const earliestHour = allSlots.reduce((current, slot) => {
    const { hour } = getTimeParts(slot.start);
    return Math.min(current, hour);
  }, Number.POSITIVE_INFINITY);

  const latestHour = allSlots.reduce((current, slot) => {
    const end = getTimeParts(slot.end);
    return Math.max(current, end.hour + (end.minute > 0 ? 1 : 0));
  }, Number.NEGATIVE_INFINITY);

  const startHour = Number.isFinite(earliestHour)
    ? earliestHour
    : typeof params.workdayStartHour === 'number'
      ? params.workdayStartHour
      : 10;
  const endHour = Number.isFinite(latestHour)
    ? latestHour
    : typeof params.workdayEndHour === 'number'
      ? params.workdayEndHour
      : startHour + 10;

  return {
    startHour,
    endHour,
    rowCount: Math.max(1, endHour - startHour)
  };
}

export function buildPlacedDaySlots(day: SlotDayGroup, timeline: WeekGridTimeline): WeekGridPlacedSlot[] {
  return day.slots.map((slot) => {
    const start = getTimeParts(slot.start);
    const end = getTimeParts(slot.end);
    const startOffsetHours = start.hour + start.minute / 60 - timeline.startHour;
    const endOffsetHours = end.hour + end.minute / 60 - timeline.startHour;
    const rowStart = Math.min(timeline.rowCount, Math.max(1, Math.floor(startOffsetHours) + 1));
    const rowSpan = Math.max(1, Math.ceil(endOffsetHours) - Math.floor(startOffsetHours));

    return {
      ...slot,
      rowStart,
      rowEnd: Math.min(timeline.rowCount + 1, rowStart + rowSpan)
    };
  });
}
