import { NextResponse } from 'next/server';
import type { CurrentUserRecoveryRequiredAppError } from '@/application/errors';
import {
  applyGoogleAuthRecoveryCookie,
  clearAuthSessionCookies
} from '@/infrastructure/auth/google-auth-flow';

export function createCurrentUserRecoveryResponse(error: CurrentUserRecoveryRequiredAppError) {
  const response = NextResponse.json(
    {
      error: error.message,
      code: error.code
    },
    { status: error.status }
  );

  applyGoogleAuthRecoveryCookie(response);
  clearAuthSessionCookies(response);

  return response;
}
