import assert from 'node:assert/strict';
import net from 'node:net';
import test from 'node:test';
import { findAvailablePort, rewriteLocalAppUrls } from './port-resolution';

test('rewriteLocalAppUrls updates localhost-based URLs when port changes', () => {
  const result = rewriteLocalAppUrls(
    {
      NEXTAUTH_URL: 'http://localhost:3000',
      GOOGLE_REDIRECT_URI: 'http://localhost:3000/auth/google/callback',
      APP_BASE_URL: 'http://localhost:3000, http://127.0.0.1:3000, https://example.com'
    },
    3000,
    3001
  );

  assert.equal(result.NEXTAUTH_URL, 'http://localhost:3001/');
  assert.equal(result.GOOGLE_REDIRECT_URI, 'http://localhost:3001/auth/google/callback');
  assert.equal(
    result.APP_BASE_URL,
    'http://localhost:3001/,http://127.0.0.1:3001/,https://example.com'
  );
});

test('findAvailablePort skips an occupied port', async () => {
  const server = net.createServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, 'object');

  const freePort = await findAvailablePort(address.port, '127.0.0.1');
  assert.notEqual(freePort, address.port);

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
});
