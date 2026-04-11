import type {
  TeamWebhookDraftState,
  TeamWebhookItem,
  TeamWebhookProvisioningState
} from './team-page-types';

export type TeamWebhookSettingsViewModel = {
  webhookDraft: TeamWebhookDraftState | null;
  setWebhookDraftUrl: (value: string) => void;
  cancelWebhookDraft: () => void;
  beginWebhookDraft: () => Promise<void>;
  webhooks: TeamWebhookItem[];
  isWebhooksLoading: boolean;
  webhookCreatePending: boolean;
  webhookActionPendingId: string | null;
  webhookProvisioning: TeamWebhookProvisioningState | null;
  handleWebhookAdd: () => Promise<boolean>;
  handleWebhookToggle: (webhookId: string, isActive: boolean) => Promise<void>;
  handleWebhookRotate: (webhookId: string) => Promise<void>;
  confirmWebhookDelete: (webhookId: string) => Promise<void>;
  handleWebhookProvisioningCopy: (value: string, label: string) => Promise<void>;
  webhookGuideHref: string;
  formatTeamWebhookActivityLabel: (webhook: TeamWebhookItem) => string;
};
