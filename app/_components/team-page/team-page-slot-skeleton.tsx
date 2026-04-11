'use client';

import React from 'react';
import type { SlotViewMode } from './team-page-slot-view-model';

function WeekModeSkeleton() {
  return (
    <section className="week-group week-group--grid week-group--skeleton">
      <div className="week-group__header">
        <div className="week-group__header-copy">
          <span className="skeleton-line skeleton-line--eyebrow" />
          <span className="skeleton-line skeleton-line--medium" />
        </div>
      </div>
      <div className="week-group__days week-group__days--grid">
        {Array.from({ length: 7 }, (_, dayIndex) => (
          <div className="week-day-column week-day-column--skeleton" key={`week-grid-skeleton-${dayIndex}`}>
            <div className="week-day-column__header">
              <span className="skeleton-line skeleton-line--short" />
              <span className="skeleton-line skeleton-line--tiny" />
            </div>
            <div className="week-day-column__slots">
              {Array.from({ length: dayIndex % 3 === 0 ? 1 : 2 }, (__, slotIndex) => (
                <div
                  className="slot-card slot-card--compact slot-card--skeleton"
                  key={`week-grid-skeleton-slot-${dayIndex}-${slotIndex}`}
                >
                  <div className="skeleton-row">
                    <div className="skeleton-line skeleton-line--short" />
                    <span className="slot-icon slot-icon--skeleton" aria-hidden="true" />
                  </div>
                  <div className="slot-people">
                    <span className="skeleton-avatar" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SlotsSkeleton({ mode: _mode }: { mode: SlotViewMode }) {
  return (
    <div className="slots-skeleton" aria-hidden="true">
      <WeekModeSkeleton />
    </div>
  );
}
