import { fetchCalendarList } from '@/infrastructure/google/calendar-list';
import { isSameOriginRequest } from '@/interface/http/request';
import { auth } from '@/infrastructure/auth/auth-options';
import { getServerRuntime } from '@/composition/server-runtime';
import { createTeamSettingsGetHandler } from './get-handler';

export const runtime = 'nodejs';

export const GET = createTeamSettingsGetHandler({
  auth,
  createDbClient: () => getServerRuntime().dbClient,
  fetchCalendarList,
  getConfig: () => getServerRuntime().env,
  getTokenVault: () => getServerRuntime().tokenVault,
  isSameOriginRequest,
});
