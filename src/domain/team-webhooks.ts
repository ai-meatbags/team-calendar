import { badRequestError } from '@/application/errors';

export const TEAM_WEBHOOK_EVENT_TYPES = ['booking.requested'] as const;
export const TEAM_WEBHOOK_STATUSES = ['active', 'disabled'] as const;
export const TEAM_WEBHOOK_DELIVERY_STATUSES = ['never', 'success', 'failed'] as const;
export const TEAM_WEBHOOK_SECRET_STATUSES = ['configured', 'cutover_required'] as const;
export const TEAM_WEBHOOK_JWT_ISSUER = 'teamcal';
export const TEAM_WEBHOOK_JWT_ALGORITHM = 'HS256';
export const TEAM_WEBHOOK_JWT_TTL_SECONDS = 120;
export const TEAM_WEBHOOK_PROVISIONING_DRAFT_TTL_SECONDS = 900;
export const TEAM_WEBHOOK_LEGACY_SECRET_PLACEHOLDER = '__teamcal_jwt_secret_cutover_required__';
export const TEAM_WEBHOOK_LAST_ERROR_MAX_LENGTH = 400;

export type TeamWebhookEventType = (typeof TEAM_WEBHOOK_EVENT_TYPES)[number];
export type TeamWebhookStatus = (typeof TEAM_WEBHOOK_STATUSES)[number];
export type TeamWebhookDeliveryStatus = (typeof TEAM_WEBHOOK_DELIVERY_STATUSES)[number];
export type TeamWebhookSecretStatus = (typeof TEAM_WEBHOOK_SECRET_STATUSES)[number];

const DEFAULT_EVENT_TYPE: TeamWebhookEventType = 'booking.requested';
const DEFAULT_STATUS: TeamWebhookStatus = 'active';
const DEFAULT_DELIVERY_STATUS: TeamWebhookDeliveryStatus = 'never';
const PRIVATE_IPV4_RANGES = [
  { first: 10, second: null },
  { first: 127, second: null },
  { first: 169, second: 254 },
  { first: 172, secondMin: 16, secondMax: 31 },
  { first: 192, second: 168 }
] as const;

function isLoopbackOrPrivateIpv4(hostname: string) {
  const parts = hostname.split('.');
  if (parts.length !== 4 || parts.some((part) => !/^\d+$/.test(part))) {
    return false;
  }

  const numbers = parts.map((part) => Number.parseInt(part, 10));
  if (numbers.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return false;
  }

  const [first, second] = numbers;
  return PRIVATE_IPV4_RANGES.some((range) => {
    if (range.first !== first) {
      return false;
    }
    if ('second' in range && range.second !== null) {
      return range.second === second;
    }
    if ('secondMin' in range && 'secondMax' in range) {
      return second >= range.secondMin && second <= range.secondMax;
    }
    return true;
  });
}

function isDisallowedWebhookHost(hostname: string) {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  if (
    normalized === 'localhost' ||
    normalized === '0.0.0.0' ||
    normalized === '::1' ||
    normalized.endsWith('.local')
  ) {
    return true;
  }

  return isLoopbackOrPrivateIpv4(normalized);
}

export function getTeamWebhookEventType(value: unknown): TeamWebhookEventType {
  return value === DEFAULT_EVENT_TYPE ? DEFAULT_EVENT_TYPE : DEFAULT_EVENT_TYPE;
}

export function getTeamWebhookStatus(value: unknown): TeamWebhookStatus {
  return value === 'disabled' ? 'disabled' : DEFAULT_STATUS;
}

export function getTeamWebhookDeliveryStatus(value: unknown): TeamWebhookDeliveryStatus {
  if (value === 'success' || value === 'failed') {
    return value;
  }
  return DEFAULT_DELIVERY_STATUS;
}

export function buildTeamWebhookAudience(webhookId: string) {
  return `team-webhook:${String(webhookId).trim()}`;
}

export function isTeamWebhookSecretProvisioned(value: unknown) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return false;
  }

  return normalized !== TEAM_WEBHOOK_LEGACY_SECRET_PLACEHOLDER;
}

export function getTeamWebhookSecretStatus(value: unknown): TeamWebhookSecretStatus {
  return isTeamWebhookSecretProvisioned(value) ? 'configured' : 'cutover_required';
}

export function normalizeTeamWebhookLastError(value: unknown) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return null;
  }

  const redacted = normalized
    .replace(/authorization:\s*bearer\s+[^\s,;]+/gi, 'authorization: bearer [redacted]')
    .replace(/bearer\s+(?!\[redacted\])[a-z0-9\-._~+/]+=*/gi, 'bearer [redacted]')
    .replace(/(["']?(?:token|secret|password)["']?\s*[:=]\s*["']?)([^"',\s]+)/gi, '$1[redacted]');

  return redacted.slice(0, TEAM_WEBHOOK_LAST_ERROR_MAX_LENGTH);
}

export function sanitizeTeamWebhookTargetUrl(value: unknown) {
  return String(value || '').trim();
}

export function assertValidTeamWebhookTargetUrl(rawValue: unknown, nodeEnv: string) {
  const value = sanitizeTeamWebhookTargetUrl(rawValue);
  if (!value) {
    throw badRequestError('Missing webhook URL.', 'missing_webhook_url');
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw badRequestError('Invalid webhook URL.', 'invalid_webhook_url');
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw badRequestError('Webhook URL must use http or https.', 'invalid_webhook_url');
  }

  if (nodeEnv === 'production' && url.protocol !== 'https:') {
    throw badRequestError('Webhook URL must use https in production.', 'invalid_webhook_url');
  }

  if (url.username || url.password) {
    throw badRequestError('Webhook URL must not contain credentials.', 'invalid_webhook_url');
  }

  if (nodeEnv !== 'test' && isDisallowedWebhookHost(url.hostname)) {
    throw badRequestError('Webhook URL host is not allowed.', 'invalid_webhook_url');
  }

  url.hash = '';
  return url.toString();
}
