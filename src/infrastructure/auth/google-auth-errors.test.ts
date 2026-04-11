import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isGoogleReauthRequiredError,
  isGoogleTransientFailureError
} from '@/application/errors';
import {
  normalizeGoogleApiError,
  normalizeGoogleCalendarEntryErrors
} from './google-auth-errors';

test('normalizeGoogleApiError maps invalid_grant to reauth-required oauth_revoked', () => {
  const error = normalizeGoogleApiError({
    response: {
      status: 400,
      data: {
        error: {
          message: 'Token has been expired or revoked.',
          errors: [{ reason: 'invalid_grant' }]
        }
      }
    }
  });

  assert.equal(isGoogleReauthRequiredError(error), true);
  assert.equal((error as any).reason, 'oauth_revoked');
});

test('normalizeGoogleApiError maps insufficient permissions to reauth-required scope_lost', () => {
  const error = normalizeGoogleApiError({
    response: {
      status: 403,
      data: {
        error: {
          message: 'Request had insufficient authentication scopes.',
          errors: [{ reason: 'insufficientPermissions' }]
        }
      }
    }
  });

  assert.equal(isGoogleReauthRequiredError(error), true);
  assert.equal((error as any).reason, 'scope_lost');
});

test('normalizeGoogleApiError maps transient Google failures to transient error', () => {
  const error = normalizeGoogleApiError({
    response: {
      status: 503,
      data: {
        error: {
          message: 'Service unavailable'
        }
      }
    }
  });

  assert.equal(isGoogleTransientFailureError(error), true);
});

test('normalizeGoogleApiError maps token refresh request failure to transient error', () => {
  const error = normalizeGoogleApiError({
    message: 'request to https://oauth2.googleapis.com/token failed, reason: '
  });

  assert.equal(isGoogleTransientFailureError(error), true);
});

test('normalizeGoogleCalendarEntryErrors maps scope problems to reauth-required', () => {
  const error = normalizeGoogleCalendarEntryErrors([
    {
      reason: 'insufficientPermissions',
      message: 'Insufficient Permission'
    }
  ]);

  assert.equal(isGoogleReauthRequiredError(error), true);
  assert.equal((error as any).reason, 'scope_lost');
});
