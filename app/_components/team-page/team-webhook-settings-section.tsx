'use client';

import React, { useEffect, useRef } from 'react';
import { TeamWebhookDraftRow } from './team-webhook-draft-row';
import { TeamWebhookListSkeleton } from './team-webhook-list-skeleton';
import { TeamWebhookEmptyState } from './team-webhook-empty-state';
import { TeamWebhookRow } from './team-webhook-row';
import type { TeamWebhookSettingsViewModel } from './team-webhook-settings-contract';

export function TeamWebhookSettingsSection({
  teamSettings,
  onOpenCreate,
  canManage
}: {
  teamSettings: TeamWebhookSettingsViewModel;
  onOpenCreate: () => void;
  canManage: boolean;
}) {
  const provisioning = teamSettings.webhookProvisioning;
  const draftAnchorRef = useRef<HTMLDivElement | null>(null);
  const hadDraftRef = useRef(false);

  useEffect(() => {
    const hasDraft = Boolean(teamSettings.webhookDraft);

    if (hasDraft && !hadDraftRef.current) {
      draftAnchorRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }

    hadDraftRef.current = hasDraft;
  }, [teamSettings.webhookDraft]);

  return (
    <div className="flex flex-col">
      {teamSettings.isWebhooksLoading ? (
        <TeamWebhookListSkeleton />
      ) : (
        <>
          {teamSettings.webhookDraft ? (
            <div ref={draftAnchorRef}>
              <TeamWebhookDraftRow
                draft={teamSettings.webhookDraft}
                pending={teamSettings.webhookCreatePending}
                onChange={teamSettings.setWebhookDraftUrl}
                onCopySecret={() =>
                  void teamSettings.handleWebhookProvisioningCopy(
                    String(teamSettings.webhookDraft?.sharedSecret || ''),
                    'Секрет'
                  )
                }
                onCancel={teamSettings.cancelWebhookDraft}
                onSubmit={() => void teamSettings.handleWebhookAdd()}
              />
            </div>
          ) : null}

          {teamSettings.webhookDraft && teamSettings.webhooks.length ? (
            <div className="my-4 px-8" aria-hidden="true">
              <div className="h-px rounded-full bg-slate-900/6" />
            </div>
          ) : null}

          {teamSettings.webhooks.length ? (
            <div className="flex flex-col gap-4">
              {teamSettings.webhooks.map((webhook) => {
                const webhookId = String(webhook.id || '');
                return (
                  <TeamWebhookRow
                    key={webhook.id || webhook.targetUrl}
                    webhook={webhook}
                    provisioning={provisioning?.webhookId === webhookId ? provisioning : null}
                    pending={teamSettings.webhookActionPendingId === webhookId}
                    busy={teamSettings.webhookActionPendingId === webhookId}
                    formatActivityLabel={teamSettings.formatTeamWebhookActivityLabel}
                    onCopyUrl={() =>
                      void teamSettings.handleWebhookProvisioningCopy(
                        String(webhook.targetUrl || ''),
                        'URL вебхука'
                      )
                    }
                    onCopySecret={() =>
                      void teamSettings.handleWebhookProvisioningCopy(
                        String(provisioning?.sharedSecret || ''),
                        'Секрет'
                      )
                    }
                    onToggle={(checked) => void teamSettings.handleWebhookToggle(webhookId, checked)}
                    onRotate={() => void teamSettings.handleWebhookRotate(webhookId)}
                    onDelete={() => void teamSettings.confirmWebhookDelete(webhookId)}
                  />
                );
              })}
            </div>
          ) : teamSettings.webhookDraft ? null : (
            <TeamWebhookEmptyState onAddClick={onOpenCreate} disabled={!canManage} />
          )}
        </>
      )}
    </div>
  );
}
