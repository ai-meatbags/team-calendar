'use client';

import React from 'react';
import {
  getMemberDisplayName,
  getMemberStableKey
} from './team-page-members';
import { formatTime } from './team-page-time';
import type { SlotCardValue } from './team-page-slot-view-model';

export function SlotCard({
  slot,
  compact = false,
  style,
  onClick
}: {
  slot: SlotCardValue;
  compact?: boolean;
  style?: React.CSSProperties;
  onClick: (slot: { start: string; end: string; members?: SlotCardValue['members'] }) => void;
}) {
  return (
    <button
      className={`slot-card ${compact ? 'slot-card--compact' : ''}`}
      type="button"
      style={style}
      onClick={() =>
        onClick({
          start: slot.start.toISOString(),
          end: slot.end.toISOString(),
          members: slot.members || []
        })
      }
    >
      <strong>
        {formatTime(slot.start)}
        <span className={`slot-icon ${compact ? 'slot-icon--compact' : ''}`} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        </span>
      </strong>
      <div className="slot-people">
        {slot.members?.length ? (
          slot.members.map((member, index) =>
            member.picture ? (
              <img
                className="slot-avatar"
                src={member.picture}
                key={getMemberStableKey(member, index)}
                alt={`Аватар ${getMemberDisplayName(member)}`}
                title={getMemberDisplayName(member)}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span
                className="slot-avatar slot-avatar--empty"
                key={getMemberStableKey(member, index)}
                title={getMemberDisplayName(member)}
                aria-hidden="true"
              />
            )
          )
        ) : (
          <div className="slot-people slot-people--empty">—</div>
        )}
      </div>
    </button>
  );
}
