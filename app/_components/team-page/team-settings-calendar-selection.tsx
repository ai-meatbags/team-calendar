'use client';

import React from 'react';
import type { CalendarSelectionItem } from './team-page-types';

export function TeamSettingsCalendarSelection({
  selection,
  onChange,
  disabled
}: {
  selection: Record<string, CalendarSelectionItem>;
  onChange: (id: string, value: CalendarSelectionItem) => void;
  disabled: boolean;
}) {
  const items = Object.values(selection || {});
  if (!items.length) {
    return <div className="empty-state">Не удалось загрузить список календарей</div>;
  }

  return (
    <div className="calendar-selection">
      {items.map((item) => (
        <label className="calendar-selection__item" key={item.id}>
          <input
            className="calendar-checkbox__input"
            type="checkbox"
            checked={Boolean(item.active)}
            disabled={disabled}
            onChange={(event) =>
              onChange(String(item.id || ''), {
                ...item,
                active: event.target.checked
              })
            }
          />
          <span className="calendar-checkbox__box" aria-hidden="true" />
          <span className="calendar-selection__title">{item.title || item.summary || item.id}</span>
        </label>
      ))}
    </div>
  );
}

export function TeamSettingsCalendarSelectionSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="calendar-selection calendar-selection--skeleton" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="calendar-selection__item calendar-selection__item--skeleton" key={index}>
          <span className="calendar-checkbox__box calendar-checkbox__box--skeleton" />
          <span className="skeleton-line skeleton-line--medium" />
        </div>
      ))}
    </div>
  );
}
