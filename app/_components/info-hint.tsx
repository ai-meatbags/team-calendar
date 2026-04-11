'use client';

import React from 'react';

export function InfoHint({
  label,
  text
}: {
  label: string;
  text: string;
}) {
  return (
    <span className="info-hint">
      <button
        type="button"
        className="info-hint__trigger"
        aria-label={label}
      >
        i
      </button>
      <span className="info-hint__bubble" role="tooltip">
        {text}
      </span>
    </span>
  );
}
