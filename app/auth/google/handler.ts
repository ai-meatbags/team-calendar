import { NextResponse } from 'next/server';

type AuthGoogleEntryDeps = {
  nextauthUrl: string;
};

export function createAuthGoogleEntryHandler(deps: AuthGoogleEntryDeps) {
  return async function GET(request: Request) {
    if (!deps.nextauthUrl) {
      throw new Error('NEXTAUTH_URL is required for /auth/google');
    }

    const url = new URL(request.url);
    const target = new URL('/api/auth/google', deps.nextauthUrl);
    const next = url.searchParams.get('next');
    const popup = url.searchParams.get('popup');

    if (next) target.searchParams.set('next', next);
    if (popup) target.searchParams.set('popup', popup);

    return NextResponse.redirect(target);
  };
}
