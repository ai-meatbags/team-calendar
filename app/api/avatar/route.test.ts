import test from 'node:test';
import assert from 'node:assert/strict';
import { createAvatarGetHandler } from './handler';

test('GET /api/avatar proxies allowed Google avatar responses with cache headers', async () => {
  const handler = createAvatarGetHandler({
    fetchImpl: async (input) =>
      new Response('avatar-bytes', {
        status: 200,
        headers: {
          'content-type': 'image/png'
        }
      })
  });

  const response = await handler(
    new Request(
      'http://localhost/api/avatar?src=https%3A%2F%2Flh3.googleusercontent.com%2Fa%2Favatar%3Ds96-c'
    )
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/png');
  assert.match(String(response.headers.get('cache-control')), /s-maxage=86400/);
  assert.equal(await response.text(), 'avatar-bytes');
});

test('GET /api/avatar rejects non-google avatar hosts', async () => {
  const handler = createAvatarGetHandler();
  const response = await handler(
    new Request('http://localhost/api/avatar?src=https%3A%2F%2Fexample.com%2Favatar.png')
  );
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.error, 'Invalid avatar source.');
});
