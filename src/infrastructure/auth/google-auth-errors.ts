import {
  googleReauthRequiredError,
  googleTransientFailureError,
  type GoogleAuthRecoveryReason
} from '@/application/errors';

type GoogleErrorPayload = {
  error?: {
    code?: number;
    status?: string;
    message?: string;
    errors?: Array<{ reason?: string; message?: string }>;
  };
  response?: {
    status?: number;
    data?: {
      error?: {
        code?: number;
        status?: string;
        message?: string;
        errors?: Array<{ reason?: string; message?: string }>;
      };
    };
  };
  code?: number | string;
  message?: string;
};

function collectGoogleErrorHints(error: GoogleErrorPayload) {
  const payloadError = error.response?.data?.error ?? error.error;
  const hints = [
    String(error.message || ''),
    String(error.code || ''),
    String(payloadError?.status || ''),
    String(payloadError?.message || '')
  ];

  for (const entry of payloadError?.errors || []) {
    hints.push(String(entry.reason || ''));
    hints.push(String(entry.message || ''));
  }

  return hints.join(' ').toLowerCase();
}

function readGoogleStatus(error: GoogleErrorPayload) {
  return error.response?.status ?? error.error?.code;
}

function inferRecoveryReason(hints: string): GoogleAuthRecoveryReason | null {
  if (
    hints.includes('invalid_grant') ||
    hints.includes('invalid credentials') ||
    hints.includes('invalid_rapt') ||
    hints.includes('token has been expired or revoked') ||
    hints.includes('invalid refresh token') ||
    hints.includes('revoked')
  ) {
    return 'oauth_revoked';
  }

  if (
    hints.includes('insufficientpermissions') ||
    hints.includes('insufficient permissions') ||
    hints.includes('insufficient authentication scopes') ||
    hints.includes('insufficient_scope') ||
    hints.includes('scope')
  ) {
    return 'scope_lost';
  }

  return null;
}

export function normalizeGoogleApiError(error: unknown) {
  const candidate = (error || {}) as GoogleErrorPayload;
  const hints = collectGoogleErrorHints(candidate);
  const recoveryReason = inferRecoveryReason(hints);

  if (recoveryReason) {
    return googleReauthRequiredError(recoveryReason);
  }

  const status = readGoogleStatus(candidate);
  if (status === 401) {
    return googleReauthRequiredError('oauth_revoked');
  }

  if (status === 403 && hints.includes('permission')) {
    return googleReauthRequiredError('scope_lost');
  }

  if (
    status === 408 ||
    status === 429 ||
    (typeof status === 'number' && status >= 500) ||
    hints.includes('timeout') ||
    hints.includes('timed out') ||
    hints.includes('request to') && hints.includes('failed') ||
    hints.includes('econnreset') ||
    hints.includes('enotfound') ||
    hints.includes('service unavailable')
  ) {
    return googleTransientFailureError();
  }

  return error instanceof Error ? error : new Error('Unexpected Google API failure.');
}

export function normalizeGoogleCalendarEntryErrors(
  entries: Array<{ reason?: string | null; message?: string | null }>
) {
  const hints = entries
    .flatMap((entry) => [String(entry.reason || ''), String(entry.message || '')])
    .join(' ')
    .toLowerCase();

  const recoveryReason = inferRecoveryReason(hints);
  if (recoveryReason) {
    return googleReauthRequiredError(recoveryReason);
  }

  return googleTransientFailureError();
}
