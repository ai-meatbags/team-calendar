export class AppError extends Error {
  status: number;
  code: string;

  constructor(params: { message: string; status: number; code: string }) {
    super(params.message);
    this.name = 'AppError';
    this.status = params.status;
    this.code = params.code;
  }
}

export function isAppError(error: unknown): error is AppError {
  if (error instanceof AppError) {
    return true;
  }

  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { status?: unknown; message?: unknown; code?: unknown; name?: unknown };
  return (
    typeof candidate.status === 'number' &&
    typeof candidate.message === 'string' &&
    (typeof candidate.code === 'string' || candidate.name === 'AppError')
  );
}

export function createAppError(status: number, message: string, code: string) {
  return new AppError({ status, message, code });
}

export function badRequestError(message: string, code = 'bad_request') {
  return createAppError(400, message, code);
}

export function unauthorizedError(message = 'Not authenticated', code = 'unauthorized') {
  return createAppError(401, message, code);
}

export function forbiddenError(message: string, code = 'forbidden') {
  return createAppError(403, message, code);
}

export function notFoundError(message: string, code = 'not_found') {
  return createAppError(404, message, code);
}

export function internalError(message: string, code = 'internal_error') {
  return createAppError(500, message, code);
}

export type GoogleAuthRecoveryReason =
  | 'missing_refresh_token'
  | 'oauth_revoked'
  | 'scope_lost';

export class GoogleReauthRequiredError extends Error {
  code: string;
  reason: GoogleAuthRecoveryReason;

  constructor(reason: GoogleAuthRecoveryReason) {
    super('Google Calendar access must be confirmed again.');
    this.name = 'GoogleReauthRequiredError';
    this.code = 'google_reauth_required';
    this.reason = reason;
  }
}

export class GoogleTransientFailureError extends Error {
  code: string;

  constructor() {
    super('Google Calendar is temporarily unavailable.');
    this.name = 'GoogleTransientFailureError';
    this.code = 'google_transient_failure';
  }
}

export class CurrentUserRecoveryRequiredAppError extends AppError {
  reason: GoogleAuthRecoveryReason;

  constructor(reason: GoogleAuthRecoveryReason) {
    super({
      status: 401,
      code: 'reauth_required',
      message: 'Need to confirm Google Calendar access again.'
    });
    this.name = 'CurrentUserRecoveryRequiredAppError';
    this.reason = reason;
  }
}

export function googleReauthRequiredError(reason: GoogleAuthRecoveryReason) {
  return new GoogleReauthRequiredError(reason);
}

export function googleTransientFailureError() {
  return new GoogleTransientFailureError();
}

export function currentUserRecoveryRequiredError(reason: GoogleAuthRecoveryReason) {
  return new CurrentUserRecoveryRequiredAppError(reason);
}

export function isGoogleReauthRequiredError(error: unknown): error is GoogleReauthRequiredError {
  return error instanceof GoogleReauthRequiredError;
}

export function isGoogleTransientFailureError(error: unknown): error is GoogleTransientFailureError {
  return error instanceof GoogleTransientFailureError;
}

export function isCurrentUserRecoveryRequiredAppError(
  error: unknown
): error is CurrentUserRecoveryRequiredAppError {
  return error instanceof CurrentUserRecoveryRequiredAppError;
}
