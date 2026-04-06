import { NextRequest, NextResponse } from 'next/server';
import type { isSameOriginRequest } from '@/interface/http/request';

type AuthLogoutDeps = {
  isSameOriginRequest: typeof isSameOriginRequest;
  signOut: (params: { redirect: false; redirectTo: string }) => Promise<unknown>;
};

function resolveRedirectPath(value: string | null) {
  if (!value) return '/';
  if (!value.startsWith('/')) return '/';
  if (value.startsWith('//')) return '/';
  return value;
}

export function createAuthLogoutHandler(deps: AuthLogoutDeps) {
  return async function GET(request: NextRequest) {
    if (!deps.isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
    }

    const url = new URL(request.url);
    const redirectPath = resolveRedirectPath(url.searchParams.get('next'));
    await deps.signOut({ redirect: false, redirectTo: redirectPath });
    return NextResponse.redirect(new URL(redirectPath, url.origin));
  };
}

export { resolveRedirectPath };
