'use client';

import React, { useMemo } from 'react';
import { SlotCard } from './team-page-slot-card';
import {
  buildPlacedDaySlots,
  buildWeekGridDays,
  type SlotWeekGroup,
  type WeekGridTimeline
} from './team-page-slot-view-model';

export function SlotWeekGridMode({
  weeks,
  timeline,
  onSlotClick
}: {
  weeks: SlotWeekGroup[];
  timeline: WeekGridTimeline;
  onSlotClick: (slot: { start: string; end: string; members?: SlotWeekGroup['days'][number]['slots'][number]['members'] }) => void;
}) {
  const weeksWithDays = useMemo(
    () =>
      weeks.map((week) => ({
        ...week,
        gridDays: buildWeekGridDays(week).map((day) => ({
          ...day,
          placedSlots: buildPlacedDaySlots(day, timeline)
        }))
      })),
    [timeline, weeks]
  );

  return (
    <>
      {weeksWithDays.map((week) => (
        <section
          className={`week-group week-group--grid ${week.isCurrentWeek ? 'week-group--current' : ''}`}
          key={week.key}
        >
          <header className="week-group__header">
            <div className="week-group__header-copy">
              {week.isCurrentWeek ? <div className="week-group__eyebrow">Эта неделя</div> : null}
              <h2 className="week-group__title">
                <span className="week-group__range">{week.label}</span>
                <span className="week-group__week-number">w{week.weekNumber}</span>
              </h2>
            </div>
          </header>
          <div className="week-group__days week-group__days--grid">
            {week.gridDays.map((day) => (
              <section
                className={`week-day-column ${day.isEmpty ? 'week-day-column--empty' : ''}`}
                key={day.key}
              >
                <header className="week-day-column__header">
                  <span className="week-day-column__date">{day.title}</span>
                  <span className="week-day-column__weekday">{day.weekday}</span>
                </header>
                <div
                  className="week-day-column__slots"
                  style={
                    {
                      '--week-grid-row-count': String(timeline.rowCount)
                    } as React.CSSProperties
                  }
                >
                  {day.isEmpty ? (
                    <div className="week-day-column__empty" aria-label={`На ${day.label} свободных слотов нет`}>
                      Нет слотов
                    </div>
                  ) : (
                    day.placedSlots.map((slot) => (
                      <SlotCard
                        key={slot.start.toISOString()}
                        slot={slot}
                        compact={true}
                        onClick={onSlotClick}
                        style={{ gridRow: `${slot.rowStart} / ${slot.rowEnd}` }}
                      />
                    ))
                  )}
                </div>
              </section>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
