export const DEFAULT_DURATION_MINUTES = 60;

export type TeamMember = {
  id?: string | null;
  name?: string | null;
  picture?: string | null;
  memberPublicId?: string | null;
};

export type TeamAvailabilitySlot = {
  start: string;
  end: string;
  members?: TeamMember[];
};

export type CalendarSelectionItem = {
  id?: string;
  title?: string;
  summary?: string;
  active?: boolean;
};

export type TeamWebhookItem = {
  id?: string | null;
  eventType?: string | null;
  targetUrl?: string | null;
  audience?: string | null;
  status?: string | null;
  isActive?: boolean | null;
  secretStatus?: 'configured' | 'cutover_required' | null;
  requiresProvisioning?: boolean | null;
  secretLastRotatedAt?: string | null;
  lastDeliveryStatus?: string | null;
  lastDeliveryAt?: string | null;
  lastError?: string | null;
};

export type TeamWebhookProvisioning = {
  provisioningToken?: string | null;
  audience?: string | null;
  sharedSecret?: string | null;
  secretVisibleOnce?: boolean | null;
};

export type TeamWebhookProvisioningState = TeamWebhookProvisioning & {
  webhookId?: string | null;
  targetUrl?: string | null;
};

export type TeamWebhookDraftState = TeamWebhookProvisioning & {
  targetUrl: string;
};
