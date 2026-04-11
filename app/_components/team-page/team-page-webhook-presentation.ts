import type { TeamWebhookItem } from './team-page-types';

const TIME_ZONE = 'Europe/Moscow';

function formatRelativeDateTime(rawValue?: string | null) {
  if (!rawValue) {
    return null;
  }

  const date = new Date(rawValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / (60 * 1000)));

  if (diffMinutes < 1) {
    return 'только что';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} мин назад`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} ч назад`;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

export function formatTeamWebhookActivityLabel(webhook: TeamWebhookItem) {
  if (webhook.requiresProvisioning || webhook.secretStatus === 'cutover_required') {
    return 'Нужно обновить секрет';
  }

  if (webhook.lastDeliveryStatus === 'success') {
    const relative = formatRelativeDateTime(webhook.lastDeliveryAt);
    return relative ? `Успешно ${relative}` : 'Успешно';
  }

  if (webhook.lastDeliveryStatus === 'failed') {
    const relative = formatRelativeDateTime(webhook.lastDeliveryAt);
    return relative ? `Ошибка ${relative}` : 'Ошибка';
  }

  return 'Запросов не было';
}

export function formatTeamWebhookSecretStatusLabel(webhook: TeamWebhookItem) {
  if (webhook.requiresProvisioning || webhook.secretStatus === 'cutover_required') {
    return 'Нужен новый secret';
  }

  if (webhook.secretLastRotatedAt) {
    return 'Secret обновлён';
  }

  return 'Секрет настроен';
}

export function formatTeamWebhookDeliveryLabel(webhook: TeamWebhookItem) {
  if (webhook.lastDeliveryStatus === 'success') {
    return 'Доставка ok';
  }

  if (webhook.lastDeliveryStatus === 'failed') {
    return 'Доставка с ошибкой';
  }

  return 'Доставок пока не было';
}

export function getTeamWebhookActivityTone(webhook: TeamWebhookItem) {
  if (webhook.requiresProvisioning || webhook.secretStatus === 'cutover_required') {
    return 'warning';
  }

  if (webhook.lastDeliveryStatus === 'success') {
    return 'success';
  }

  if (webhook.lastDeliveryStatus === 'failed') {
    return 'error';
  }

  return 'neutral';
}
