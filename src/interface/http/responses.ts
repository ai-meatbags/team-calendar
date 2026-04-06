import { NextResponse } from 'next/server';
import { isAppError } from '@/application/errors';

export function badRequest(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export function unauthorized() {
  return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
}

export function forbidden(error = 'Forbidden') {
  return NextResponse.json({ error }, { status: 403 });
}

export function notFound(error = 'Not found') {
  return NextResponse.json({ error }, { status: 404 });
}

export function errorResponse(error: unknown, fallbackMessage = 'Request failed') {
  if (isAppError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
