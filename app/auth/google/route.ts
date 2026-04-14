import { getEnv } from '@/composition/env';
import { createAuthGoogleEntryHandler } from './handler';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { NEXTAUTH_URL } = getEnv();
  return createAuthGoogleEntryHandler({
    nextauthUrl: NEXTAUTH_URL || ''
  })(request);
}
