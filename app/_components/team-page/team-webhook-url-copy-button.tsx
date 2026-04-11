'use client';

import React from 'react';
import { Copy } from 'lucide-react';
import { cn } from '../../../components/ui/utils';

export function TeamWebhookUrlCopyButton({
  url,
  onCopy,
  className
}: {
  url: string;
  onCopy: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onCopy}
      className={cn(
        'inline-flex w-full min-w-0 items-center gap-2 overflow-hidden text-left font-medium text-slate-900 outline-none transition hover:text-[var(--accent)] focus:outline-none focus-visible:outline-none focus-visible:ring-0',
        className
      )}
      aria-label="Скопировать URL вебхука"
    >
      <span className="shrink-0 text-slate-500" aria-hidden="true">
        <Copy size={15} strokeWidth={1.9} />
      </span>
      <span className="min-w-0 truncate">{url}</span>
    </button>
  );
}
