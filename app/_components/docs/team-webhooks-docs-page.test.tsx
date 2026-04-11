import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TeamWebhooksDocsPage } from './team-webhooks-docs-page';

test('TeamWebhooksDocsPage renders one blessed verification flow', () => {
  const html = renderToStaticMarkup(<TeamWebhooksDocsPage />);

  assert.match(html, /Как проверить Team Webhooks/);
  assert.match(html, /JWT Bearer/);
  assert.match(html, /HS256/);
  assert.match(html, /X-Teamcal-Event-Id/);
  assert.match(html, /Compat mode не поддерживается/);
  assert.match(html, /Никаких JWKS, basic auth, body HMAC или fallback modes/);
  assert.doesNotMatch(html, /RS256/);
});
