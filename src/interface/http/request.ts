import crypto from 'node:crypto';
import type { NextRequest } from 'next/server';

export function getRequestId(request: NextRequest) {
  return request.headers.get('x-request-id') || crypto.randomUUID();
}

export function getClientFingerprint(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown-ip';
  const ua = request.headers.get('user-agent') || 'unknown-ua';
  return `${ip}|${ua}`;
}

export function isSameOriginRequest(request: NextRequest) {
  const source = request.headers.get('origin') || request.headers.get('referer');
  if (!source) return false;

  try {
    const sourceOrigin = new URL(source).origin;
    const appBaseUrl = process.env.APP_BASE_URL;
    if (!appBaseUrl) return false;
    const allowedOrigins = String(appBaseUrl)
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => {
        try {
          return new URL(value).origin;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as string[];

    if (!allowedOrigins.length) {
      return false;
    }

    if (allowedOrigins.includes(sourceOrigin)) {
      return true;
    }

    const sourceHost = new URL(sourceOrigin).hostname;
    const allowedHosts = Array.from(
      new Set(
        allowedOrigins
          .map((origin) => {
            try {
              return new URL(origin).hostname;
            } catch {
              return null;
            }
          })
          .filter(Boolean)
      )
    );

    return allowedHosts.includes(sourceHost);
  } catch {
    return false;
  }
}
