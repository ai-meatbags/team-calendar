import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const target = new URL('/api/auth/google', url.origin);
  const next = url.searchParams.get('next');
  const popup = url.searchParams.get('popup');
  if (next) target.searchParams.set('next', next);
  if (popup) target.searchParams.set('popup', popup);
  return NextResponse.redirect(target);
}
