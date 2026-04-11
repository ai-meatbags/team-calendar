import { auth } from '@/infrastructure/auth/auth-options';
import { getServerRuntime } from '@/composition/server-runtime';
import { isSameOriginRequest } from '@/interface/http/request';
import {
  createTeamWebhookDeleteHandler,
  createTeamWebhookPatchHandler
} from '../handlers';

export const runtime = 'nodejs';

export const PATCH = createTeamWebhookPatchHandler({
  auth,
  createDbClient: () => getServerRuntime().dbClient,
  getConfig: () => getServerRuntime().env,
  getTokenVault: () => getServerRuntime().tokenVault,
  isSameOriginRequest
});

export const DELETE = createTeamWebhookDeleteHandler({
  auth,
  createDbClient: () => getServerRuntime().dbClient,
  getConfig: () => getServerRuntime().env,
  getTokenVault: () => getServerRuntime().tokenVault,
  isSameOriginRequest
});
