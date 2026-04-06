import { auth } from '@/infrastructure/auth/auth-options';
import { getServerRuntime } from '@/composition/server-runtime';
import { isSameOriginRequest } from '@/interface/http/request';
import {
  createTeamWebhooksGetHandler,
  createTeamWebhooksPostHandler
} from './handlers';

export const runtime = 'nodejs';

export const GET = createTeamWebhooksGetHandler({
  auth,
  createDbClient: () => getServerRuntime().dbClient,
  getConfig: () => getServerRuntime().env,
  isSameOriginRequest
});

export const POST = createTeamWebhooksPostHandler({
  auth,
  createDbClient: () => getServerRuntime().dbClient,
  getConfig: () => getServerRuntime().env,
  isSameOriginRequest
});
