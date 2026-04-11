import { NextRequest } from 'next/server';
import type { AppEnv } from '@/composition/env';
import { isCurrentUserRecoveryRequiredAppError } from '@/application/errors';
import { resolveAuthSessionToken } from '@/infrastructure/auth/google-auth-flow';
import type { createDbClient } from '@/infrastructure/db/client';
import type { fetchCalendarList } from '@/infrastructure/google/calendar-list';
import type { isSameOriginRequest } from '@/interface/http/request';
import { errorResponse, forbidden, unauthorized } from '@/interface/http/responses';
import type { TokenVaultPort } from '@/ports/security';
import { getCurrentUserCalendarSettings } from '@/application/usecases/get-current-user';
import { getCurrentUserSlotRuleDefaults, patchCurrentUserSlotRuleDefaults } from '@/application/usecases/slot-rules-settings';
import { createCurrentUserRecoveryResponse } from '../recovery-response';

type MeSettingsConfig = Pick<AppEnv, 'GOOGLE_CLIENT_ID' | 'GOOGLE_CLIENT_SECRET'>;

type MeSettingsRouteDeps = {
  auth: () => Promise<any>;
  createDbClient: typeof createDbClient;
  fetchCalendarList: typeof fetchCalendarList;
  getConfig: () => MeSettingsConfig;
  getTokenVault: () => TokenVaultPort;
  isSameOriginRequest: typeof isSameOriginRequest;
};

export function createMeSettingsGetHandler(deps: MeSettingsRouteDeps) {
  return async function GET(request: NextRequest) {
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
      const sessionToken = resolveAuthSessionToken(request.headers.get('cookie'));

      const calendarSettings = await getCurrentUserCalendarSettings(userId, {
        createDbClient: deps.createDbClient,
        decryptRefreshToken: tokenVault.decrypt,
        fetchCalendarList: deps.fetchCalendarList,
        googleClientId: config.GOOGLE_CLIENT_ID,
        googleClientSecret: config.GOOGLE_CLIENT_SECRET
      }, {
        sessionToken
      });
      const slotRuleDefaults = await getCurrentUserSlotRuleDefaults(userId, {
        createDbClient: deps.createDbClient
      });

      return Response.json({
        ...calendarSettings,
        ...slotRuleDefaults
      });
    } catch (error) {
      if (isCurrentUserRecoveryRequiredAppError(error)) {
        return createCurrentUserRecoveryResponse(error);
      }
      return errorResponse(error, 'Failed to load settings.');
    }
  };
}

export function createMeSettingsPatchHandler(deps: MeSettingsRouteDeps) {
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
      const payload = await patchCurrentUserSlotRuleDefaults(
        userId,
        body && typeof body === 'object' ? (body as { slotRuleDefaults?: unknown }).slotRuleDefaults : undefined,
        {
          createDbClient: deps.createDbClient
        }
      );

      return Response.json(payload);
    } catch (error) {
      return errorResponse(error, 'Failed to update settings.');
    }
  };
}
