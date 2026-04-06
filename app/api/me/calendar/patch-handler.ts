import { NextRequest } from 'next/server';
import type { AppEnv } from '@/composition/env';
import type { createDbClient } from '@/infrastructure/db/client';
import type { fetchCalendarList } from '@/infrastructure/google/calendar-list';
import type { isSameOriginRequest } from '@/interface/http/request';
import { errorResponse, forbidden, unauthorized } from '@/interface/http/responses';
import type { TokenVaultPort } from '@/ports/security';
import { patchCurrentUserCalendarSettings } from '@/application/usecases/get-current-user';

type MeCalendarConfig = Pick<AppEnv, 'GOOGLE_CLIENT_ID' | 'GOOGLE_CLIENT_SECRET'>;

type MeCalendarRouteDeps = {
  auth: () => Promise<any>;
  createDbClient: typeof createDbClient;
  fetchCalendarList: typeof fetchCalendarList;
  getConfig: () => MeCalendarConfig;
  getTokenVault: () => TokenVaultPort;
  isSameOriginRequest: typeof isSameOriginRequest;
};

export function createMeCalendarPatchHandler(deps: MeCalendarRouteDeps) {
  return async function PATCH(request: NextRequest) {
    try {
      const session = await deps.auth();
      const userId = String(session?.user?.id || '').trim();
      if (!userId) {
        return unauthorized();
      }

      if (!deps.isSameOriginRequest(request)) {
        return forbidden('Invalid origin.');
      }

      const body = await request.json().catch(() => ({}));
      const config = deps.getConfig();
      const tokenVault = deps.getTokenVault();

      const payload = await patchCurrentUserCalendarSettings(userId, body?.calendarSelection, {
        createDbClient: deps.createDbClient,
        decryptRefreshToken: tokenVault.decrypt,
        fetchCalendarList: deps.fetchCalendarList,
        googleClientId: config.GOOGLE_CLIENT_ID,
        googleClientSecret: config.GOOGLE_CLIENT_SECRET
      });

      return Response.json(payload);
    } catch (error) {
      return errorResponse(error, 'Failed to update calendar selection.');
    }
  };
}
