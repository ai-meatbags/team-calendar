import { auth } from '@/infrastructure/auth/auth-options';
import { getServerRuntime } from '@/composition/server-runtime';
import { isSameOriginRequest } from '@/interface/http/request';
import { createTeamWebhookRotatePostHandler } from '../../handlers';

export const runtime = 'nodejs';

export const POST = createTeamWebhookRotatePostHandler({
  auth,
  createDbClient: () => getServerRuntime().dbClient,
  getConfig: () => getServerRuntime().env,
  getTokenVault: () => getServerRuntime().tokenVault,
  isSameOriginRequest
});
