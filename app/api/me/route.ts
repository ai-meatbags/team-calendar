import { auth } from '@/infrastructure/auth/auth-options';
import { getServerRuntime } from '@/composition/server-runtime';
import { isSameOriginRequest } from '@/interface/http/request';
import { createMeGetHandler, createMePatchHandler } from './get-handler';

export const runtime = 'nodejs';

export const GET = createMeGetHandler({
  auth,
  createDbClient: () => getServerRuntime().dbClient,
  isSameOriginRequest
});

export const PATCH = createMePatchHandler({
  auth,
  createDbClient: () => getServerRuntime().dbClient,
  isSameOriginRequest
});
