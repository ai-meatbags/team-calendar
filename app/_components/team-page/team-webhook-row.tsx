'use client';

import React from 'react';
import { Badge } from '../../../components/ui/badge';
import { getTeamWebhookActivityTone } from './team-page-webhook-presentation';
import type { TeamWebhookItem } from './team-page-types';
import { TeamWebhookSecretInline } from './team-webhook-secret-inline';
import { TeamWebhookToggle } from './team-webhook-toggle';
import { TeamWebhookUrlCopyButton } from './team-webhook-url-copy-button';

function TeamWebhookActivity({
  tone,
  label
}: {
  tone: 'success' | 'error' | 'warning' | 'neutral';
  label: string;
}) {
  const toneClass =
    tone === 'success'
      ? 'text-emerald-700'
      : tone === 'error'
        ? 'text-red-700'
        : tone === 'warning'
          ? 'text-amber-700'
          : 'text-slate-500';
  const dotClass =
    tone === 'success'
      ? 'bg-emerald-500'
      : tone === 'error'
        ? 'bg-red-500'
        : tone === 'warning'
          ? 'bg-amber-500'
          : 'bg-slate-300';

  return (
    <div className={`flex items-center gap-2 text-sm ${toneClass}`}>
      <span className={`size-2 rounded-full ${dotClass}`} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function TeamWebhookRow({
  webhook,
  provisioning,
  pending,
  busy,
  formatActivityLabel,
  onCopyUrl,
  onCopySecret,
  onToggle,
  onRotate,
  onDelete
}: {
  webhook: TeamWebhookItem;
  provisioning?: { sharedSecret?: string | null } | null;
  pending: boolean;
  busy: boolean;
  formatActivityLabel: (webhook: TeamWebhookItem) => string;
  onCopyUrl: () => void;
  onCopySecret: () => void;
  onToggle: (checked: boolean) => void;
  onRotate: () => void;
  onDelete: () => void;
}) {
  const isActive = Boolean(webhook.isActive);
  const actionsDisabled = busy || !isActive;
  const activityTone = provisioning?.sharedSecret ? 'neutral' : getTeamWebhookActivityTone(webhook);
  const activityLabel = provisioning?.sharedSecret
    ? 'Секрет обновлён'
    : formatActivityLabel(webhook);

  function handleRotateClick() {
    if (actionsDisabled) {
      return;
    }
    if (!window.confirm('Обновить секрет? Старый секрет перестанет работать.')) {
      return;
    }
    void onRotate();
  }

  function handleDeleteClick() {
    if (actionsDisabled) {
      return;
    }
    if (!window.confirm('Удалить вебхук? Это действие нельзя отменить.')) {
      return;
    }
    void onDelete();
  }

  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 py-1">
      <div className="row-start-1 self-center">
        <TeamWebhookToggle
          checked={isActive}
          onChange={onToggle}
          disabled={busy}
        />
      </div>
      <div className={`row-start-1 min-w-0 grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 ${isActive ? '' : 'opacity-45'}`}>
        <Badge className="self-center px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-slate-700" variant="default">
          POST
        </Badge>
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0 flex-1">
            <TeamWebhookUrlCopyButton
              url={String(webhook.targetUrl || '—')}
              onCopy={onCopyUrl}
              className="text-[15px] leading-6"
            />
          </div>
          <div className="team-webhook-row__actions">
            <button className="btn btn--ghost btn--sm team-webhook-row__action-button" type="button" onClick={handleRotateClick} disabled={actionsDisabled}>
              {pending ? 'Сохраняем...' : 'Обновить секрет'}
            </button>
            <button
              className="btn btn--ghost btn--sm team-settings-danger-button team-webhook-row__action-button"
              type="button"
              onClick={handleDeleteClick}
              disabled={actionsDisabled}
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
      <div className={`col-start-2 min-w-0 grid gap-2 ${isActive ? '' : 'opacity-45'}`}>
        <TeamWebhookActivity tone={activityTone} label={activityLabel} />
        {provisioning?.sharedSecret ? (
          <TeamWebhookSecretInline
            sharedSecret={String(provisioning.sharedSecret)}
            onCopy={onCopySecret}
          />
        ) : null}
      </div>
    </div>
  );
}
