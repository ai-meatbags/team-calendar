import { NextRequest } from 'next/server';
import type { AppEnv } from '@/composition/env';
import type { createDbClient } from '@/infrastructure/db/client';
import type { fetchCalendarList } from '@/infrastructure/google/calendar-list';
import type { isSameOriginRequest } from '@/interface/http/request';
import { errorResponse, forbidden, unauthorized } from '@/interface/http/responses';
import type { TokenVaultPort } from '@/ports/security';
import { getTeamSettings } from '@/application/usecases/team-page';

type TeamSettingsConfig = Pick<AppEnv, 'GOOGLE_CLIENT_ID' | 'GOOGLE_CLIENT_SECRET'>;

type TeamSettingsRouteDeps = {
  auth: () => Promise<any>;
  createDbClient: typeof createDbClient;
  fetchCalendarList: typeof fetchCalendarList;
  getConfig: () => TeamSettingsConfig;
  getTokenVault: () => TokenVaultPort;
  isSameOriginRequest: typeof isSameOriginRequest;
};

export function createTeamSettingsGetHandler(deps: TeamSettingsRouteDeps) {
  return async function GET(
    request: NextRequest,
    context: { params: Promise<{ shareId: string }> }
  ) {
    try {
      const session = await deps.auth();
      const userId = String(session?.user?.id || '').trim();
      if (!userId) {
        return unauthorized();
      }

      if (!deps.isSameOriginRequest(request)) {
        return forbidden('Invalid origin.');
      }

      const config = deps.getConfig();
      const tokenVault = deps.getTokenVault();
      const { shareId } = await context.params;

      const payload = await getTeamSettings(
        {
          createDbClient: deps.createDbClient,
          decryptRefreshToken: tokenVault.decrypt,
          fetchCalendarList: deps.fetchCalendarList,
          googleClientId: config.GOOGLE_CLIENT_ID,
          googleClientSecret: config.GOOGLE_CLIENT_SECRET
        },
        { shareId, userId }
      );

      return Response.json(payload);
    } catch (error) {
      return errorResponse(error, 'Failed to load team settings.');
    }
  };
}
