'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import type { TeamWebhookDraftState } from './team-page-types';
import { TeamWebhookSecretField } from './team-webhook-secret-field';
import { TeamWebhookToggle } from './team-webhook-toggle';

export function TeamWebhookDraftRow({
  draft,
  pending,
  onChange,
  onCopySecret,
  onCancel,
  onSubmit
}: {
  draft: TeamWebhookDraftState;
  pending: boolean;
  onChange: (value: string) => void;
  onCopySecret: () => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="pt-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="text-base font-semibold text-slate-900">Новый JWT вебхук</h3>
          <p className="max-w-full truncate text-sm text-slate-500">
            Сделай POST вебхук, настрой JWT авторизацию по passphrase с алгоритмом HS256, возьми секрет ниже, вставь сюда URL и сохрани
          </p>
        </div>
        <button
          className="btn btn--ghost btn--sm inline-flex size-10 items-center justify-center rounded-full p-0"
          type="button"
          onClick={onCancel}
          disabled={pending}
          aria-label="Закрыть создание вебхука"
        >
          <X size={18} strokeWidth={2.1} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2">
        <div className="self-center">
          <TeamWebhookToggle checked={false} disabled={false} readOnly={true} onChange={() => undefined} />
        </div>
        <Badge
          className="self-center px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-slate-700"
          variant="default"
        >
          POST
        </Badge>
        <Input
          type="url"
          inputMode="url"
          placeholder="https://hooks.example.com/webhook"
          value={draft.targetUrl}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Webhook URL"
          disabled={pending}
        />

        <div />
        <div />
        <p className="text-sm text-slate-500">Статус: ещё не создан</p>

        <div />
        <div />
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0 flex-1">
            <TeamWebhookSecretField value={String(draft.sharedSecret || '')} onCopy={onCopySecret} />
          </div>
          <button className="btn btn--primary btn--sm" type="button" onClick={onSubmit} disabled={pending}>
            {pending ? 'Сохраняем...' : 'Сохранить вебхук'}
          </button>
        </div>
      </div>
    </div>
  );
}
