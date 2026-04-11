'use client';

import React from 'react';
import { Copy } from 'lucide-react';

export function TeamWebhookSecretField({
  value,
  onCopy
}: {
  value: string;
  onCopy: () => void;
}) {
  function handleCopy() {
    void Promise.resolve(onCopy());
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute left-3 top-1/2 z-10 inline-flex -translate-y-1/2 items-center text-slate-500 transition hover:text-slate-900"
        aria-label="Скопировать секрет"
      >
        <Copy size={16} strokeWidth={1.9} />
      </button>

      <input
        type="password"
        readOnly
        value={value}
        onClick={handleCopy}
        aria-label="Секрет вебхука"
        className="flex h-11 w-full rounded-xl border border-emerald-500/20 bg-white py-3 pl-11 pr-40 font-mono text-sm text-slate-900 transition focus:border-[rgba(239,108,56,0.4)] focus:outline-none focus:ring-2 focus:ring-[rgba(239,108,56,0.2)]"
      />

      <span className="pointer-events-none absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
        Нажми, чтобы скопировать
      </span>
    </div>
  );
}
