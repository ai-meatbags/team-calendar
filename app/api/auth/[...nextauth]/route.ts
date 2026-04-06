import { handleAuthGet, handleAuthPost } from '@/infrastructure/auth/auth-options';

export const runtime = 'nodejs';

export async function GET(...args: Parameters<typeof handleAuthGet>) {
  return handleAuthGet(...args);
}

export async function POST(...args: Parameters<typeof handleAuthPost>) {
  return handleAuthPost(...args);
}
