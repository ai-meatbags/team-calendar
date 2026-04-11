'use client';

import React from 'react';
import { CalendarDays, Rows3 } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '../../../components/ui/toggle-group';
import type { SlotViewMode } from './team-page-slot-view-model';

export function SlotViewToggle({
  mode,
  onModeChange
}: {
  mode: SlotViewMode;
  onModeChange: (mode: SlotViewMode) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      value={mode}
      size="sm"
      onValueChange={(value) => {
        if (value === 'list' || value === 'week') {
          onModeChange(value);
        }
      }}
      className="toggle slot-view-toggle"
      aria-label="Режим просмотра слотов"
    >
      <ToggleGroupItem
        value="list"
        className="slot-view-toggle__item"
        aria-label="Режим список"
        data-slot-view-mode="list"
      >
        <span className="slot-view-toggle__icon">
          <Rows3 strokeWidth={1.9} />
        </span>
        <span>Список</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="week"
        className="slot-view-toggle__item"
        aria-label="Режим неделя"
        data-slot-view-mode="week"
      >
        <span className="slot-view-toggle__icon">
          <CalendarDays strokeWidth={1.9} />
        </span>
        <span>Неделя</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
