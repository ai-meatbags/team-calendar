import { NextResponse } from 'next/server';
import { clearGoogleAuthRecoveryCookie } from '@/infrastructure/auth/google-auth-flow';

export const runtime = 'nodejs';

function resolveNextPath(value: string | null) {
  if (!value) return '/';
  if (!value.startsWith('/')) return '/';
  if (value.startsWith('//')) return '/';
  return value;
}

function buildPopupHtml(redirectPath: string) {
  const safeRedirect = JSON.stringify(redirectPath);
  const safeContinuePath = JSON.stringify('/');
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Authorized</title>
  </head>
  <body>
    <p id="auth-popup-status">Completing sign-in...</p>
    <script>
      (function () {
        var redirectPath = ${safeRedirect};
        var continuePath = ${safeContinuePath};
        var statusNode = document.getElementById('auth-popup-status');
        var payload = {
          type: 'auth:success',
          redirectPath: redirectPath,
          at: Date.now()
        };
        var closed = false;

        try {
          if (window.opener && window.opener !== window) {
            window.opener.postMessage(payload, window.location.origin);
          }
        } catch (error) {}

        try {
          if (typeof BroadcastChannel !== 'undefined') {
            var channel = new BroadcastChannel('team-calendar-auth');
            channel.postMessage(payload);
            channel.close();
          }
        } catch (error) {}

        try {
          localStorage.setItem('team-calendar-auth-success', JSON.stringify(payload));
          localStorage.removeItem('team-calendar-auth-success');
        } catch (error) {}

        try {
          window.close();
          closed = window.closed;
        } catch (error) {}

        if (!closed) {
          try {
            window.open('', '_self');
            window.close();
            closed = window.closed;
          } catch (error) {}
        }

        if (closed) {
          return;
        }

        if (statusNode) {
          statusNode.textContent = 'Sign-in completed. You can close this window.';
        }
        document.body.insertAdjacentHTML(
          'beforeend',
          '<p><a href="' + continuePath.replace(/"/g, '&quot;') + '">Continue to teams</a></p>'
        );
      })();
    </script>
  </body>
</html>`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectPath = resolveNextPath(url.searchParams.get('next'));

  const response = new NextResponse(buildPopupHtml(redirectPath), {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store'
    }
  });

  clearGoogleAuthRecoveryCookie(response);

  return response;
}
