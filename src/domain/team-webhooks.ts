import { badRequestError } from '@/application/errors';

export const TEAM_WEBHOOK_EVENT_TYPES = ['booking.requested'] as const;
export const TEAM_WEBHOOK_STATUSES = ['active', 'disabled'] as const;
export const TEAM_WEBHOOK_DELIVERY_STATUSES = ['never', 'success', 'failed'] as const;

export type TeamWebhookEventType = (typeof TEAM_WEBHOOK_EVENT_TYPES)[number];
export type TeamWebhookStatus = (typeof TEAM_WEBHOOK_STATUSES)[number];
export type TeamWebhookDeliveryStatus = (typeof TEAM_WEBHOOK_DELIVERY_STATUSES)[number];

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
    if (range.second !== undefined && range.second !== null) {
      return range.second === second;
    }
    if (range.secondMin !== undefined && range.secondMax !== undefined) {
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
