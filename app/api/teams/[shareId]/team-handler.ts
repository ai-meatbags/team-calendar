import { NextRequest, NextResponse } from 'next/server';
import type { AppEnv } from '@/composition/env';
import type { createDbClient } from '@/infrastructure/db/client';
import type { fetchCalendarList } from '@/infrastructure/google/calendar-list';
import type { isSameOriginRequest } from '@/interface/http/request';
import { toAvatarProxyUrl } from '@/interface/http/avatar-proxy';
import { errorResponse, forbidden, unauthorized } from '@/interface/http/responses';
import type { TokenVaultPort } from '@/ports/security';
import {
  deleteTeam,
  getTeamPage,
  patchTeamSettings
} from '@/application/usecases/team-page';

type TeamRouteConfig = Pick<AppEnv, 'GOOGLE_CLIENT_ID' | 'GOOGLE_CLIENT_SECRET'>;

type TeamRouteDeps = {
  auth: () => Promise<any>;
  createDbClient: typeof createDbClient;
  fetchCalendarList: typeof fetchCalendarList;
  getConfig: () => TeamRouteConfig;
  getTokenVault: () => TokenVaultPort;
  isSameOriginRequest: typeof isSameOriginRequest;
};

export function createTeamGetHandler(deps: TeamRouteDeps) {
  return async function GET(
    _request: NextRequest,
    context: { params: Promise<{ shareId: string }> }
  ) {
    try {
      const session = await deps.auth();
      const userId = String(session?.user?.id || '').trim() || null;
      const { shareId } = await context.params;
      const payload = await getTeamPage({
        createDbClient: deps.createDbClient,
        shareId,
        userId
      });

      return NextResponse.json({
        ...payload,
        members: payload.members.map((member) => ({
          ...member,
          picture: toAvatarProxyUrl(member.picture)
        }))
      });
    } catch (error) {
      return errorResponse(error, 'Failed to load team.');
    }
  };
}

export function createTeamPatchHandler(deps: TeamRouteDeps) {
  return async function PATCH(
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
      const body = await request.json().catch(() => ({}));

      const payload = await patchTeamSettings(
        {
          createDbClient: deps.createDbClient,
          decryptRefreshToken: tokenVault.decrypt,
          fetchCalendarList: deps.fetchCalendarList,
          googleClientId: config.GOOGLE_CLIENT_ID,
          googleClientSecret: config.GOOGLE_CLIENT_SECRET
        },
        { shareId, userId, body }
      );

      return NextResponse.json(payload);
    } catch (error) {
      return errorResponse(error, 'Failed to update team settings.');
    }
  };
}

export function createTeamDeleteHandler(deps: TeamRouteDeps) {
  return async function DELETE(
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

      const { shareId } = await context.params;
      const payload = await deleteTeam(deps.createDbClient, { shareId, userId });
      return NextResponse.json(payload);
    } catch (error) {
      return errorResponse(error, 'Failed to delete team.');
    }
  };
}
