import { randomBytes, randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import type { AppEnv } from '@/composition/env';
import type { createDbClient } from '@/infrastructure/db/client';
import type { TokenVaultPort } from '@/ports/security';
import type { isSameOriginRequest } from '@/interface/http/request';
import { badRequest, errorResponse, forbidden, unauthorized } from '@/interface/http/responses';
import {
  addTeamWebhook,
  deleteTeamWebhook,
  listTeamWebhooks,
  prepareTeamWebhookDraft,
  rotateTeamWebhookSecret,
  toggleTeamWebhook
} from '@/application/usecases/team-webhooks';

type TeamWebhookRouteConfig = Pick<AppEnv, 'NODE_ENV'>;

type TeamWebhookRouteDeps = {
  auth: () => Promise<any>;
  createDbClient: typeof createDbClient;
  getConfig: () => TeamWebhookRouteConfig;
  getTokenVault: () => Pick<TokenVaultPort, 'encrypt' | 'decrypt'>;
  isSameOriginRequest: typeof isSameOriginRequest;
};

function requireUserId(session: any) {
  return String(session?.user?.id || '').trim();
}

export function createTeamWebhooksGetHandler(deps: TeamWebhookRouteDeps) {
  return async function GET(
    request: NextRequest,
    context: { params: Promise<{ shareId: string }> }
  ) {
    try {
      const session = await deps.auth();
      const userId = requireUserId(session);
      if (!userId) {
        return unauthorized();
      }

      if (!deps.isSameOriginRequest(request)) {
        return forbidden('Invalid origin.');
      }

      const { shareId } = await context.params;
      const payload = await listTeamWebhooks(deps.createDbClient, { shareId, userId });
      return NextResponse.json(payload);
    } catch (error) {
      return errorResponse(error, 'Failed to load team webhooks.');
    }
  };
}

export function createTeamWebhooksPostHandler(deps: TeamWebhookRouteDeps) {
  return async function POST(
    request: NextRequest,
    context: { params: Promise<{ shareId: string }> }
  ) {
    try {
      const session = await deps.auth();
      const userId = requireUserId(session);
      if (!userId) {
        return unauthorized();
      }

      if (!deps.isSameOriginRequest(request)) {
        return forbidden('Invalid origin.');
      }

      const body = await request.json().catch(() => ({}));
      const { shareId } = await context.params;
      const payload = await addTeamWebhook(deps.createDbClient, {
        shareId,
        userId,
        targetUrl: body && typeof body === 'object' ? (body as Record<string, unknown>).targetUrl : null,
        provisioningToken:
          body && typeof body === 'object' ? (body as Record<string, unknown>).provisioningToken : null,
        decryptDraft: deps.getTokenVault().decrypt,
        encryptSecret: deps.getTokenVault().encrypt,
        nowIso: new Date().toISOString(),
        nodeEnv: deps.getConfig().NODE_ENV
      });
      return NextResponse.json(payload, { status: 201 });
    } catch (error) {
      return errorResponse(error, 'Failed to create team webhook.');
    }
  };
}

export function createTeamWebhooksPreparePostHandler(deps: TeamWebhookRouteDeps) {
  return async function POST(
    request: NextRequest,
    context: { params: Promise<{ shareId: string }> }
  ) {
    try {
      const session = await deps.auth();
      const userId = requireUserId(session);
      if (!userId) {
        return unauthorized();
      }

      if (!deps.isSameOriginRequest(request)) {
        return forbidden('Invalid origin.');
      }

      const { shareId } = await context.params;
      const payload = await prepareTeamWebhookDraft(deps.createDbClient, {
        shareId,
        userId,
        generateId: randomUUID,
        generateSharedSecret: () => randomBytes(32).toString('base64url'),
        encryptDraft: deps.getTokenVault().encrypt,
        nowIso: new Date().toISOString()
      });
      return NextResponse.json(payload, { status: 201 });
    } catch (error) {
      return errorResponse(error, 'Failed to prepare team webhook.');
    }
  };
}

export function createTeamWebhookPatchHandler(deps: TeamWebhookRouteDeps) {
  return async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ shareId: string; webhookId: string }> }
  ) {
    try {
      const session = await deps.auth();
      const userId = requireUserId(session);
      if (!userId) {
        return unauthorized();
      }

      if (!deps.isSameOriginRequest(request)) {
        return forbidden('Invalid origin.');
      }

      const body = await request.json().catch(() => ({}));
      const isActive = body && typeof body === 'object' ? (body as Record<string, unknown>).isActive : undefined;
      if (typeof isActive !== 'boolean') {
        return badRequest('Invalid webhook state.');
      }

      const { shareId, webhookId } = await context.params;
      const payload = await toggleTeamWebhook(deps.createDbClient, {
        shareId,
        userId,
        webhookId,
        isActive,
        nowIso: new Date().toISOString()
      });
      return NextResponse.json(payload);
    } catch (error) {
      return errorResponse(error, 'Failed to update team webhook.');
    }
  };
}

export function createTeamWebhookDeleteHandler(deps: TeamWebhookRouteDeps) {
  return async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ shareId: string; webhookId: string }> }
  ) {
    try {
      const session = await deps.auth();
      const userId = requireUserId(session);
      if (!userId) {
        return unauthorized();
      }

      if (!deps.isSameOriginRequest(request)) {
        return forbidden('Invalid origin.');
      }

      const { shareId, webhookId } = await context.params;
      const payload = await deleteTeamWebhook(deps.createDbClient, {
        shareId,
        userId,
        webhookId
      });
      return NextResponse.json(payload);
    } catch (error) {
      return errorResponse(error, 'Failed to delete team webhook.');
    }
  };
}

export function createTeamWebhookRotatePostHandler(deps: TeamWebhookRouteDeps) {
  return async function POST(
    request: NextRequest,
    context: { params: Promise<{ shareId: string; webhookId: string }> }
  ) {
    try {
      const session = await deps.auth();
      const userId = requireUserId(session);
      if (!userId) {
        return unauthorized();
      }

      if (!deps.isSameOriginRequest(request)) {
        return forbidden('Invalid origin.');
      }

      const { shareId, webhookId } = await context.params;
      const payload = await rotateTeamWebhookSecret(deps.createDbClient, {
        shareId,
        userId,
        webhookId,
        generateSharedSecret: () => randomBytes(32).toString('base64url'),
        encryptSecret: deps.getTokenVault().encrypt,
        nowIso: new Date().toISOString()
      });
      return NextResponse.json(payload);
    } catch (error) {
      return errorResponse(error, 'Failed to rotate team webhook secret.');
    }
  };
}
