import { createAuthGoogleHandler } from './handler';
export const runtime = 'nodejs';

export const GET = createAuthGoogleHandler({
  signIn: async (provider, options, authorizationParams) => {
    const { signIn } = await import('@/infrastructure/auth/auth-options');
    return signIn(provider, options, authorizationParams);
  }
});
