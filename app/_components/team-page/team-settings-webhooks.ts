'use client';

import { useCallback, useState } from 'react';
import { formatTeamWebhookActivityLabel } from './team-page-webhook-presentation';
import type {
  TeamWebhookDraftState,
  TeamWebhookItem,
  TeamWebhookProvisioningState
} from './team-page-types';
import {
  executeTeamWebhookCreateAction,
  executeTeamWebhookDeleteAction,
  executeTeamWebhookPrepareAction,
  executeTeamWebhookRotateAction,
  executeTeamWebhookToggleAction,
  type ApiFetch
} from './team-page-state';
import type { TeamWebhooksResponse } from './team-settings-contract';

export function useTeamSettingsWebhooks({
  shareId,
  apiFetch,
  showToast
}: {
  shareId: string;
  apiFetch: ApiFetch;
  showToast: (message: string) => void;
}) {
  const [webhooks, setWebhooks] = useState<TeamWebhookItem[]>([]);
  const [isWebhooksLoading, setIsWebhooksLoading] = useState(true);
  const [webhookDraft, setWebhookDraft] = useState<TeamWebhookDraftState | null>(null);
  const [webhookActionPendingId, setWebhookActionPendingId] = useState<string | null>(null);
  const [webhookActionMode, setWebhookActionMode] = useState<
    'prepare' | 'add' | 'toggle' | 'rotate' | 'delete' | null
  >(null);
  const [webhookProvisioning, setWebhookProvisioning] = useState<TeamWebhookProvisioningState | null>(
    null
  );

  const loadWebhooks = useCallback(
    async (canDelete: boolean) => {
      setIsWebhooksLoading(true);
      if (!canDelete) {
        setWebhooks([]);
        setWebhookDraft(null);
        setWebhookProvisioning(null);
        setIsWebhooksLoading(false);
        return;
      }

      try {
        const webhooksData = (await apiFetch(
          `/api/teams/${shareId}/integrations/webhooks`
        )) as TeamWebhooksResponse;
        setWebhooks(webhooksData.webhooks || []);
        setWebhookDraft(null);
        setWebhookProvisioning(null);
      } finally {
        setIsWebhooksLoading(false);
      }
    },
    [apiFetch, shareId]
  );

  const beginWebhookDraft = useCallback(async () => {
    if (!shareId || webhookDraft?.provisioningToken) {
      return;
    }

    setWebhookProvisioning(null);
    setWebhookActionMode('prepare');
    setWebhookActionPendingId(null);
    try {
      const payload = await executeTeamWebhookPrepareAction({ shareId, apiFetch });
      if (payload.provisioning?.sharedSecret && payload.provisioning?.provisioningToken) {
        setWebhookDraft({
          ...payload.provisioning,
          targetUrl: ''
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось подготовить вебхук';
      showToast(message || 'Не удалось подготовить вебхук');
    } finally {
      setWebhookActionMode(null);
      setWebhookActionPendingId(null);
    }
  }, [apiFetch, shareId, showToast, webhookDraft?.provisioningToken]);

  const setWebhookDraftUrl = useCallback((value: string) => {
    setWebhookDraft((current) => (current ? { ...current, targetUrl: value } : current));
  }, []);

  const cancelWebhookDraft = useCallback(() => {
    if (webhookActionMode === 'add') {
      return;
    }
    setWebhookDraft(null);
  }, [webhookActionMode]);

  const handleWebhookAdd = useCallback(async () => {
    if (!shareId || !webhookDraft?.provisioningToken) {
      return false;
    }

    setWebhookActionMode('add');
    setWebhookActionPendingId(null);
    try {
      const payload = await executeTeamWebhookCreateAction({
        shareId,
        targetUrl: webhookDraft.targetUrl,
        provisioningToken: webhookDraft.provisioningToken,
        apiFetch
      });
      if (payload.webhook) {
        setWebhooks((current) => [...current, payload.webhook as TeamWebhookItem]);
      }
      setWebhookDraft(null);
      showToast('Вебхук добавлен');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось добавить вебхук';
      showToast(message || 'Не удалось добавить вебхук');
      return false;
    } finally {
      setWebhookActionMode(null);
      setWebhookActionPendingId(null);
    }
  }, [apiFetch, shareId, showToast, webhookDraft]);

  const handleWebhookToggle = useCallback(
    async (webhookId: string, isActive: boolean) => {
      if (!shareId || !webhookId) {
        return;
      }

      const previousWebhooks = webhooks;
      setWebhookActionMode('toggle');
      setWebhookActionPendingId(webhookId);
      setWebhooks((current) =>
        current.map((webhook) =>
          webhook.id === webhookId
            ? {
                ...webhook,
                isActive,
                status: isActive ? 'active' : 'disabled'
              }
            : webhook
        )
      );
      try {
        const payload = await executeTeamWebhookToggleAction({ shareId, webhookId, isActive, apiFetch });
        if (payload.webhook) {
          setWebhooks((current) =>
            current.map((webhook) =>
              webhook.id === webhookId ? (payload.webhook as TeamWebhookItem) : webhook
            )
          );
        }
      } catch (error) {
        setWebhooks(previousWebhooks);
        const message = error instanceof Error ? error.message : 'Не удалось обновить вебхук';
        showToast(message || 'Не удалось обновить вебхук');
      } finally {
        setWebhookActionMode(null);
        setWebhookActionPendingId(null);
      }
    },
    [apiFetch, shareId, showToast, webhooks]
  );

  const handleWebhookRotate = useCallback(
    async (webhookId: string) => {
      if (!shareId || !webhookId) {
        return;
      }

      setWebhookActionMode('rotate');
      setWebhookActionPendingId(webhookId);
      try {
        const payload = await executeTeamWebhookRotateAction({ shareId, webhookId, apiFetch });
        if (payload.webhook) {
          setWebhooks((current) =>
            current.map((webhook) =>
              webhook.id === webhookId ? (payload.webhook as TeamWebhookItem) : webhook
            )
          );
          setWebhookProvisioning({
            ...(payload.provisioning || {}),
            webhookId: payload.webhook.id,
            targetUrl: payload.webhook.targetUrl
          });
        }
        showToast('Секрет обновлён');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Не удалось обновить секрет';
        showToast(message || 'Не удалось обновить секрет');
      } finally {
        setWebhookActionMode(null);
        setWebhookActionPendingId(null);
      }
    },
    [apiFetch, shareId, showToast]
  );

  const confirmWebhookDelete = useCallback(
    async (webhookId: string) => {
      const normalizedWebhookId = String(webhookId || '').trim();
      if (!shareId || !normalizedWebhookId) {
        return;
      }

      setWebhookActionMode('delete');
      setWebhookActionPendingId(normalizedWebhookId);
      try {
        await executeTeamWebhookDeleteAction({ shareId, webhookId: normalizedWebhookId, apiFetch });
        setWebhooks((current) => current.filter((webhook) => webhook.id !== normalizedWebhookId));
        setWebhookProvisioning((current) =>
          current?.webhookId === normalizedWebhookId ? null : current
        );
        showToast('Вебхук удалён');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Не удалось удалить вебхук';
        showToast(message || 'Не удалось удалить вебхук');
      } finally {
        setWebhookActionMode(null);
        setWebhookActionPendingId(null);
      }
    },
    [apiFetch, shareId, showToast]
  );

  const handleWebhookProvisioningCopy = useCallback(
    async (value: string, label: string) => {
      if (!value.trim()) {
        return;
      }

      try {
        await navigator.clipboard.writeText(value);
        showToast(`${label} скопирован`);
      } catch {
        showToast('Не удалось скопировать значение');
      }
    },
    [showToast]
  );

  return {
    webhooks,
    isWebhooksLoading,
    webhookDraft,
    setWebhookDraftUrl,
    cancelWebhookDraft,
    beginWebhookDraft,
    webhookActionPendingId,
    webhookProvisioning,
    webhookCreatePending: webhookActionMode === 'prepare' || webhookActionMode === 'add',
    webhookGuideHref: '/docs/team-webhooks',
    formatTeamWebhookActivityLabel,
    loadWebhooks,
    handleWebhookAdd,
    handleWebhookToggle,
    handleWebhookRotate,
    confirmWebhookDelete,
    handleWebhookProvisioningCopy
  };
}
