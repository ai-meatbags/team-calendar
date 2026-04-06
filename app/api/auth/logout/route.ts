import { signOut } from '@/infrastructure/auth/auth-options';
import { isSameOriginRequest } from '@/interface/http/request';
import { createAuthLogoutHandler } from './handler';

export const runtime = 'nodejs';

export const GET = createAuthLogoutHandler({
  isSameOriginRequest,
  signOut
});
