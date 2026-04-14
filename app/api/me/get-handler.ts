import { NextRequest, NextResponse } from 'next/server';
import { isCurrentUserRecoveryRequiredAppError } from '@/application/errors';
import { resolveAuthSessionToken } from '@/infrastructure/auth/google-auth-flow';
import type { createDbClient } from '@/infrastructure/db/client';
import type { isSameOriginRequest } from '@/interface/http/request';
import { errorResponse, unauthorized, forbidden } from '@/interface/http/responses';
import { toAvatarProxyUrl } from '@/interface/http/avatar-proxy';
import {
  enforceCurrentUserAccountRecoveryIfNeeded,
  getCurrentUserById,
  updateCurrentUserName
} from '@/application/usecases/get-current-user';
import { createCurrentUserRecoveryResponse } from './recovery-response';

type MeRouteDeps = {
  auth: () => Promise<any>;
  createDbClient: typeof createDbClient;
  isSameOriginRequest: typeof isSameOriginRequest;
};

function toPublicUser(user: any, session: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    picture: toAvatarProxyUrl(user.image || session?.user?.image || null)
  };
}

export function createMeGetHandler(deps: MeRouteDeps) {
  return async function GET(request?: NextRequest) {
    try {
      const session = await deps.auth();
      const userId = String(session?.user?.id || '').trim();
      if (!userId) {
        return unauthorized();
      }
      const sessionToken = resolveAuthSessionToken(request?.headers.get('cookie'));
      await enforceCurrentUserAccountRecoveryIfNeeded(deps.createDbClient, userId, sessionToken);

      const user = await getCurrentUserById(userId, {
        createDbClient: deps.createDbClient
      });

      if (!user) {
        return unauthorized();
      }

      return NextResponse.json(toPublicUser(user, session));
    } catch (error) {
      if (isCurrentUserRecoveryRequiredAppError(error)) {
        return createCurrentUserRecoveryResponse(error);
      }
      return errorResponse(error, 'Failed to load user.');
    }
  };
}

export function createMePatchHandler(deps: MeRouteDeps) {
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
      const user = await updateCurrentUserName(userId, body?.name, {
        createDbClient: deps.createDbClient
      });

      return NextResponse.json(toPublicUser(user, session));
    } catch (error) {
      return errorResponse(error, 'Failed to update user.');
    }
  };
}
