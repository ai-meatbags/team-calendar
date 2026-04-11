'use client';

import React from 'react';
import { Webhook } from 'lucide-react';
export function TeamWebhookEmptyState({
  onAddClick,
  disabled = false
}: {
  onAddClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-900/12 bg-slate-900/[0.02] px-6 py-10 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-slate-900/[0.05] text-slate-500">
        <Webhook className="size-5" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-slate-900">Вебхуков пока нет</p>
        <p className="text-sm text-slate-500">Добавьте вебхук, чтобы получать события команды</p>
      </div>
      <button className="btn btn--primary btn--sm" type="button" onClick={onAddClick} disabled={disabled}>
        Добавить вебхук
      </button>
    </div>
  );
}
