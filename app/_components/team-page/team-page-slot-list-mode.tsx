'use client';

import React from 'react';
import { SlotCard } from './team-page-slot-card';
import type { SlotWeekGroup } from './team-page-slot-view-model';

function DaySlots({
  label,
  slots,
  onSlotClick
}: {
  label: string;
  slots: SlotWeekGroup['days'][number]['slots'];
  onSlotClick: (slot: { start: string; end: string; members?: SlotWeekGroup['days'][number]['slots'][number]['members'] }) => void;
}) {
  return (
    <div className="day-group">
      <div className="day-group__title">{label}</div>
      <div className="slot-grid">
        {slots.map((slot) => (
          <SlotCard key={slot.start.toISOString()} slot={slot} onClick={onSlotClick} />
        ))}
      </div>
    </div>
  );
}

export function SlotListMode({
  weeks,
  onSlotClick
}: {
  weeks: SlotWeekGroup[];
  onSlotClick: (slot: { start: string; end: string; members?: SlotWeekGroup['days'][number]['slots'][number]['members'] }) => void;
}) {
  return (
    <>
      {weeks.map((week) => (
        <section className={`week-group ${week.isCurrentWeek ? 'week-group--current' : ''}`} key={week.key}>
          <header className="week-group__header">
            <div className="week-group__header-copy">
              {week.isCurrentWeek ? <div className="week-group__eyebrow">Эта неделя</div> : null}
              <h2 className="week-group__title">
                <span className="week-group__range">{week.label}</span>
                <span className="week-group__week-number">w{week.weekNumber}</span>
              </h2>
            </div>
          </header>
          <div className="week-group__days">
            {week.days.map((day) => (
              <DaySlots key={day.key} label={day.label} slots={day.slots} onSlotClick={onSlotClick} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
