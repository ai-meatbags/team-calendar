export const GOOGLE_AUTH_RECOVERY_COOKIE_NAME = 'teamcal_google_reauth';
export const GOOGLE_AUTH_RECOVERY_MAX_AGE_SECONDS = 60 * 15;
export const AUTH_SESSION_COOKIE_NAMES = ['authjs.session-token', '__Secure-authjs.session-token'] as const;

type GoogleAuthorizationParams =
  | string[][]
  | Record<string, string>
  | string
  | URLSearchParams
  | undefined;

function readCookieValue(cookieHeader: string | null | undefined, name: string) {
  if (!cookieHeader) {
    return null;
  }

  for (const chunk of cookieHeader.split(';')) {
    const trimmed = chunk.trim();
    if (!trimmed.startsWith(`${name}=`)) {
      continue;
    }

    return decodeURIComponent(trimmed.slice(name.length + 1));
  }

  return null;
}

export function hasGoogleAuthRecoverySignal(cookieHeader: string | null | undefined) {
  return readCookieValue(cookieHeader, GOOGLE_AUTH_RECOVERY_COOKIE_NAME) === '1';
}

export function resolveAuthSessionToken(cookieHeader: string | null | undefined) {
  for (const name of AUTH_SESSION_COOKIE_NAMES) {
    const value = readCookieValue(cookieHeader, name);
    if (value) {
      return value;
    }
  }

  return null;
}

export function buildGoogleAuthorizationParams(recoveryMode: boolean): GoogleAuthorizationParams {
  if (!recoveryMode) {
    return undefined;
  }

  return {
    access_type: 'offline',
    prompt: 'consent'
  };
}

export function applyGoogleAuthRecoveryCookie(response: {
  cookies: {
    set: (name: string, value: string, options: Record<string, unknown>) => void;
  };
}) {
  response.cookies.set(GOOGLE_AUTH_RECOVERY_COOKIE_NAME, '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: GOOGLE_AUTH_RECOVERY_MAX_AGE_SECONDS
  });
}

export function clearGoogleAuthRecoveryCookie(response: {
  cookies: {
    set: (name: string, value: string, options: Record<string, unknown>) => void;
  };
}) {
  response.cookies.set(GOOGLE_AUTH_RECOVERY_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0)
  });
}

export function clearAuthSessionCookies(response: {
  cookies: {
    set: (name: string, value: string, options: Record<string, unknown>) => void;
  };
}) {
  for (const name of AUTH_SESSION_COOKIE_NAMES) {
    response.cookies.set(name, '', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0)
    });
  }
}
