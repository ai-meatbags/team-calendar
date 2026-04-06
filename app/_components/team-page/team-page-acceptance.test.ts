import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  buildTeamPageSearchHref,
  executeTeamDeleteAction,
  executeTeamJoinAction,
  executeTeamShareAction,
  executeTeamWebhookCreateAction,
  executeTeamWebhookDeleteAction,
  executeTeamWebhookToggleAction,
  resolveTeamBookingSubmission,
  resolveTeamWebhookCreateSubmission,
  resolveTeamSettingsSubmission,
  TEAM_DELETE_CONFIRMATION_MESSAGE
} from './team-page-state';

const repoRoot = process.cwd();

test('team page helpers are sourced from shared module instead of duplicated legacy code', () => {
  const nextSource = readFileSync(
    path.join(repoRoot, 'app/_components/team-page/team-page-utils.ts'),
    'utf8'
  );
  const sharedSource = readFileSync(
    path.join(repoRoot, 'src/shared/team-ui.js'),
    'utf8'
  );

  assert.match(nextSource, /from '@\/shared\/team-ui\.js'/);
  assert.match(sharedSource, /export function canRenderJoinButton/);
});

test('URL helper preserves duration and member filters in shareable href', () => {
  const href = buildTeamPageSearchHref(
    '/t/share-123',
    new URLSearchParams('duration=30&member=member_1')
  );

  assert.equal(href, '/t/share-123?duration=30&member=member_1');
});

test('guest join action opens auth popup instead of calling join API', async () => {
  let popupCalls = 0;
  let apiCalls = 0;

  const result = await executeTeamJoinAction({
    shareId: 'share-123',
    hasUser: false,
    openAuthPopup: () => {
      popupCalls += 1;
    },
    apiFetch: async () => {
      apiCalls += 1;
      return null;
    },
    refresh: async () => undefined,
    showToast: () => undefined
  });

  assert.equal(result, 'auth');
  assert.equal(popupCalls, 1);
  assert.equal(apiCalls, 0);
});

test('member join action posts to API and refreshes team state', async () => {
  const calls: string[] = [];

  const result = await executeTeamJoinAction({
    shareId: 'share-123',
    hasUser: true,
    openAuthPopup: () => {
      calls.push('popup');
    },
    apiFetch: async (path, options) => {
      calls.push(`${options?.method}:${path}`);
      return null;
    },
    refresh: async () => {
      calls.push('refresh');
    },
    showToast: () => undefined
  });

  assert.equal(result, 'joined');
  assert.deepEqual(calls, ['POST:/api/teams/share-123/join', 'refresh']);
});

test('share action copies the current filtered URL and reports success', async () => {
  const clipboard: string[] = [];
  const toasts: string[] = [];

  const result = await executeTeamShareAction({
    locationHref: 'https://example.test/t/share-123?duration=30&member=member_1',
    writeClipboardText: async (value) => {
      clipboard.push(value);
    },
    showToast: (message) => {
      toasts.push(message);
    },
    shareToastMessage: 'Скопирована ссылка'
  });

  assert.equal(result, 'shared');
  assert.deepEqual(clipboard, [
    'https://example.test/t/share-123?duration=30&member=member_1'
  ]);
  assert.deepEqual(toasts, ['Скопирована ссылка']);
});

test('booking submission requires guest email and uses auth email for logged-in flow', () => {
  const guestFailure = resolveTeamBookingSubmission({
    shareId: 'share-123',
    teamName: 'Core Team',
    currentSlot: { start: '2026-03-08T10:00:00.000Z', end: '2026-03-08T11:00:00.000Z' },
    formEmail: '',
    comment: 'Созвон',
    isLoggedIn: false,
    selectionMode: 'single',
    selectedMembers: [{ memberPublicId: 'member_1', name: 'Иван' }]
  });
  assert.deepEqual(guestFailure, { ok: false, message: 'Укажи почту' });

  const authSubmission = resolveTeamBookingSubmission({
    shareId: 'share-123',
    teamName: 'Core Team',
    currentSlot: { start: '2026-03-08T10:00:00.000Z', end: '2026-03-08T11:00:00.000Z' },
    currentUserEmail: 'owner@example.com',
    formEmail: '',
    comment: 'Созвон',
    isLoggedIn: true,
    selectionMode: 'single',
    selectedMembers: [{ memberPublicId: 'member_1', name: 'Иван' }]
  });

  assert.equal(authSubmission.ok, true);
  if (!authSubmission.ok) {
    throw new Error('expected successful auth booking payload');
  }
  assert.deepEqual(authSubmission.payload, {
    shareId: 'share-123',
    teamName: 'Core Team',
    slotStart: '2026-03-08T10:00:00.000Z',
    slotEnd: '2026-03-08T11:00:00.000Z',
    email: 'owner@example.com',
    comment: 'Созвон',
    selectionMode: 'single',
    selectedMemberPublicIds: ['member_1']
  });
});

test('team settings submission detects no-op and builds patch payload for changes', () => {
  const noChanges = resolveTeamSettingsSubmission({
    calendarSelection: {
      primary: { id: 'primary', title: 'Primary', active: true }
    },
    baseSelection: {
      primary: { id: 'primary', title: 'Primary', active: true }
    },
    teamNameDraft: 'Core Team',
    baseName: 'Core Team',
    canEditName: true,
    privacyDraft: 'public',
    basePrivacy: 'public',
    canEditPrivacy: true
  });

  assert.deepEqual(noChanges, { kind: 'no-changes' });

  const changed = resolveTeamSettingsSubmission({
    calendarSelection: {
      primary: { id: 'primary', title: 'Primary', active: false }
    },
    baseSelection: {
      primary: { id: 'primary', title: 'Primary', active: true }
    },
    teamNameDraft: 'New Team',
    baseName: 'Core Team',
    canEditName: true,
    privacyDraft: 'private',
    basePrivacy: 'public',
    canEditPrivacy: true
  });

  assert.equal(changed.kind, 'submit');
  if (changed.kind !== 'submit') {
    throw new Error('expected submit result');
  }
  assert.deepEqual(changed.payload, {
    name: 'New Team',
    privacy: 'private',
    calendarSelection: {
      primary: { active: false }
    }
  });
});

test('delete action respects confirm dialog and redirects only after successful delete', async () => {
  assert.equal(
    TEAM_DELETE_CONFIRMATION_MESSAGE,
    'Удалить команду? Все участники будут удалены, действие необратимо.'
  );

  const cancelled: string[] = [];
  const cancelledResult = await executeTeamDeleteAction({
    shareId: 'share-123',
    confirmDelete: () => false,
    apiFetch: async () => {
      cancelled.push('api');
      return null;
    },
    navigateHome: () => {
      cancelled.push('navigate');
    },
    showToast: () => undefined
  });

  assert.equal(cancelledResult, 'cancelled');
  assert.deepEqual(cancelled, []);

  const confirmed: string[] = [];
  const confirmedResult = await executeTeamDeleteAction({
    shareId: 'share-123',
    confirmDelete: () => true,
    apiFetch: async (path, options) => {
      confirmed.push(`${options?.method}:${path}`);
      return null;
    },
    navigateHome: () => {
      confirmed.push('navigate');
    },
    showToast: () => undefined
  });

  assert.equal(confirmedResult, 'deleted');
  assert.deepEqual(confirmed, ['DELETE:/api/teams/share-123', 'navigate']);
});

test('team webhook create submission trims url and validates empty input', () => {
  assert.deepEqual(resolveTeamWebhookCreateSubmission({ targetUrl: '' }), {
    ok: false,
    message: 'Укажи URL вебхука'
  });

  assert.deepEqual(resolveTeamWebhookCreateSubmission({ targetUrl: ' https://hooks.example.com/booking ' }), {
    ok: true,
    payload: {
      targetUrl: 'https://hooks.example.com/booking'
    }
  });
});

test('team webhook actions call expected API endpoints', async () => {
  const calls: Array<{ path: string; method?: string; body?: string | undefined }> = [];

  await executeTeamWebhookCreateAction({
    shareId: 'share-123',
    targetUrl: 'https://hooks.example.com/booking',
    apiFetch: async (path, options) => {
      calls.push({
        path,
        method: options?.method,
        body: String(options?.body || '')
      });
      return { webhook: { id: 'webhook-1' } };
    }
  });

  await executeTeamWebhookToggleAction({
    shareId: 'share-123',
    webhookId: 'webhook-1',
    isActive: false,
    apiFetch: async (path, options) => {
      calls.push({
        path,
        method: options?.method,
        body: String(options?.body || '')
      });
      return { webhook: { id: 'webhook-1', isActive: false } };
    }
  });

  await executeTeamWebhookDeleteAction({
    shareId: 'share-123',
    webhookId: 'webhook-1',
    apiFetch: async (path, options) => {
      calls.push({
        path,
        method: options?.method,
        body: String(options?.body || '')
      });
      return { deleted: true };
    }
  });

  assert.deepEqual(calls, [
    {
      path: '/api/teams/share-123/integrations/webhooks',
      method: 'POST',
      body: '{"targetUrl":"https://hooks.example.com/booking"}'
    },
    {
      path: '/api/teams/share-123/integrations/webhooks/webhook-1',
      method: 'PATCH',
      body: '{"isActive":false}'
    },
    {
      path: '/api/teams/share-123/integrations/webhooks/webhook-1',
      method: 'DELETE',
      body: ''
    }
  ]);
});
