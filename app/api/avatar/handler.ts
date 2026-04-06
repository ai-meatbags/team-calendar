import { NextResponse } from 'next/server';
import { resolveAvatarProxySource } from '@/interface/http/avatar-proxy';

const AVATAR_CACHE_CONTROL = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800';

type AvatarRouteDeps = {
  fetchImpl?: typeof fetch;
};

export function createAvatarGetHandler(deps: AvatarRouteDeps = {}) {
  const fetchImpl = deps.fetchImpl || fetch;

  return async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const remoteUrl = resolveAvatarProxySource(requestUrl.searchParams.get('src'));

    if (!remoteUrl) {
      return NextResponse.json({ error: 'Invalid avatar source.' }, { status: 400 });
    }

    const upstream = await fetchImpl(remoteUrl, {
      headers: {
        accept: 'image/*'
      },
      cache: 'force-cache',
      next: { revalidate: 60 * 60 * 24 }
    } as RequestInit & { next: { revalidate: number } });

    if (!upstream.ok) {
      return NextResponse.json({ error: 'Failed to load avatar.' }, { status: 502 });
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid avatar response.' }, { status: 502 });
    }

    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': AVATAR_CACHE_CONTROL
      }
    });
  };
}
