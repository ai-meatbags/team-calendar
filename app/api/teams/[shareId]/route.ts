import { fetchCalendarList } from '@/infrastructure/google/calendar-list';
import { isSameOriginRequest } from '@/interface/http/request';
import { auth } from '@/infrastructure/auth/auth-options';
import { getServerRuntime } from '@/composition/server-runtime';
import {
  createTeamDeleteHandler,
  createTeamGetHandler,
  createTeamPatchHandler
} from './team-handler';

export const runtime = 'nodejs';

export const GET = createTeamGetHandler({
  auth,
  createDbClient: () => getServerRuntime().dbClient,
  fetchCalendarList,
  getConfig: () => getServerRuntime().env,
  getTokenVault: () => getServerRuntime().tokenVault,
  isSameOriginRequest,
});

export const PATCH = createTeamPatchHandler({
  auth,
  createDbClient: () => getServerRuntime().dbClient,
  fetchCalendarList,
  getConfig: () => getServerRuntime().env,
  getTokenVault: () => getServerRuntime().tokenVault,
  isSameOriginRequest,
});

export const DELETE = createTeamDeleteHandler({
  auth,
  createDbClient: () => getServerRuntime().dbClient,
  fetchCalendarList,
  getConfig: () => getServerRuntime().env,
  getTokenVault: () => getServerRuntime().tokenVault,
  isSameOriginRequest,
});
