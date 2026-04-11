'use client';

import React, { useMemo } from 'react';
import { formatCount, formatHour } from './team-page-time';

type TeamPageSlotRulesSummaryProps = {
  settingsSummary: {
    days?: number;
    workdayStartHour?: number;
    workdayEndHour?: number;
    minNoticeHours?: number;
    timeMin?: string;
    timeMax?: string;
  } | null;
};

export function TeamPageSlotRulesSummary({ settingsSummary }: TeamPageSlotRulesSummaryProps) {
  const windowLabel = useMemo(() => {
    if (!settingsSummary) {
      return '—';
    }
    const rangeStart = settingsSummary.timeMin ? new Date(settingsSummary.timeMin) : null;
    const rangeEnd = settingsSummary.timeMax ? new Date(settingsSummary.timeMax) : null;
    const days =
      typeof settingsSummary.days === 'number' && Number.isFinite(settingsSummary.days)
        ? settingsSummary.days
        : rangeStart && rangeEnd
          ? Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (24 * 60 * 60 * 1000))
          : null;
    if (!days) {
      return '—';
    }
    return `${formatCount(days, ['день', 'дня', 'дней'])} вперед`;
  }, [settingsSummary]);

  const hoursLabel = useMemo(() => {
    if (!settingsSummary) {
      return '—';
    }
    if (
      typeof settingsSummary.workdayStartHour === 'number' &&
      typeof settingsSummary.workdayEndHour === 'number'
    ) {
      return `${formatHour(settingsSummary.workdayStartHour)}—${formatHour(
        settingsSummary.workdayEndHour
      )} МСК`;
    }
    return '—';
  }, [settingsSummary]);

  const minLabel = useMemo(() => {
    if (!settingsSummary) {
      return '—';
    }
    if (typeof settingsSummary.minNoticeHours === 'number') {
      return formatCount(settingsSummary.minNoticeHours, ['час', 'часа', 'часов']);
    }
    return '—';
  }, [settingsSummary]);

  if (!settingsSummary) {
    return null;
  }

  return (
    <div className="slot-meta slot-meta--single-row team-page-card__rules">
      <span className="rules-label rules-label--inline">Правила показа:</span>
      <span className="rule-item">
        Окно <span>{windowLabel}</span>
      </span>
      <span className="rule-item">
        <span>{hoursLabel}</span>
      </span>
      <span className="rule-item">
        бронь минимум за <span>{minLabel}</span>
      </span>
    </div>
  );
}
