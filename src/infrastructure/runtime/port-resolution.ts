import net from 'node:net';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const MAX_PORT_CANDIDATES = 20;

async function canBindPort(port: number, host?: string) {
  return await new Promise<boolean>((resolve) => {
    const server = net.createServer();

    server.once('error', () => resolve(false));
    server.listen({ port, host }, () => {
      server.close(() => resolve(true));
    });
  });
}

function rewriteLocalUrl(rawValue: string, fromPort: number, toPort: number) {
  try {
    const url = new URL(rawValue);
    if (!LOCAL_HOSTS.has(url.hostname)) {
      return rawValue;
    }

    const currentPort = url.port ? Number(url.port) : undefined;
    if (currentPort !== fromPort) {
      return rawValue;
    }

    url.port = String(toPort);
    return url.toString();
  } catch {
    return rawValue;
  }
}

export async function findAvailablePort(preferredPort: number, host?: string) {
  for (let offset = 0; offset < MAX_PORT_CANDIDATES; offset += 1) {
    const candidatePort = preferredPort + offset;
    if (await canBindPort(candidatePort, host)) {
      return candidatePort;
    }
  }

  throw new Error(`Could not find an available port near ${preferredPort}.`);
}

export function rewriteLocalAppUrls(env: NodeJS.ProcessEnv, fromPort: number, toPort: number) {
  if (fromPort === toPort) {
    return env;
  }

  const nextEnv = { ...env };

  if (nextEnv.NEXTAUTH_URL) {
    nextEnv.NEXTAUTH_URL = rewriteLocalUrl(nextEnv.NEXTAUTH_URL, fromPort, toPort);
  }

  if (nextEnv.GOOGLE_REDIRECT_URI) {
    nextEnv.GOOGLE_REDIRECT_URI = rewriteLocalUrl(nextEnv.GOOGLE_REDIRECT_URI, fromPort, toPort);
  }

  if (nextEnv.APP_BASE_URL) {
    nextEnv.APP_BASE_URL = nextEnv.APP_BASE_URL.split(',')
      .map((value) => rewriteLocalUrl(value.trim(), fromPort, toPort))
      .join(',');
  }

  return nextEnv;
}
