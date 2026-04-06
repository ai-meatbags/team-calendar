import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  return NextResponse.redirect(new URL('/api/auth/logout', url.origin));
}
