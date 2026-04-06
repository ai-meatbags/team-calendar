import { NextResponse } from 'next/server';

type SignInFn = (
  provider?: string,
  options?: { redirect?: boolean; redirectTo?: string }
) => Promise<string>;

export type AuthGoogleDeps = {
  signIn: SignInFn;
};

function resolveNextPath(value: string | null) {
  if (!value) return null;
  if (!value.startsWith('/')) return null;
  if (value.startsWith('//')) return null;
  return value;
}

export function createAuthGoogleHandler(deps: AuthGoogleDeps) {
  return async function GET(request: Request) {
    const url = new URL(request.url);
    const next = resolveNextPath(url.searchParams.get('next'));
    const popup = url.searchParams.get('popup') === '1';
    const redirectTo = popup
      ? `/auth/popup-complete${next ? `?next=${encodeURIComponent(next)}` : ''}`
      : next || '/';

    const target = await deps.signIn('google', {
      redirect: false,
      redirectTo
    });

    return NextResponse.redirect(target);
  };
}
