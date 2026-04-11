'use client';

import React from 'react';

export function TeamWebhookToggle({
  checked,
  disabled,
  readOnly = false,
  onChange
}: {
  checked: boolean;
  disabled: boolean;
  readOnly?: boolean;
  onChange: (nextChecked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={checked ? 'Выключить вебхук' : 'Включить вебхук'}
      disabled={disabled}
      onClick={() => {
        if (disabled || readOnly) {
          return;
        }
        onChange(!checked);
      }}
      className={[
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border p-0.5 transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(239,108,56,0.35)]',
        disabled ? 'cursor-not-allowed opacity-50' : readOnly ? 'cursor-default' : '',
        checked
          ? 'border-emerald-500/40 bg-emerald-500 shadow-[inset_0_1px_2px_rgba(6,95,70,0.24)]'
          : 'border-slate-900/12 bg-white shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)]'
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'block size-5 rounded-full border border-slate-900/8 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.18)] transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0'
        ].join(' ')}
      />
    </button>
  );
}
