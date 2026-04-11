import { NextRequest } from 'next/server';
import type { createDbClient } from '@/infrastructure/db/client';
import type { isSameOriginRequest } from '@/interface/http/request';
import { errorResponse, forbidden, unauthorized } from '@/interface/http/responses';
import { patchTeamSlotRuleOverride, resetTeamSlotRuleOverride } from '@/application/usecases/slot-rules-settings';

type TeamSlotRulesRouteDeps = {
  auth: () => Promise<any>;
  createDbClient: typeof createDbClient;
  generateId: () => string;
  isSameOriginRequest: typeof isSameOriginRequest;
};

export function createTeamSlotRulesPatchHandler(deps: TeamSlotRulesRouteDeps) {
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

      const body = await request.json().catch(() => ({}));
      const { shareId } = await context.params;
      const payload = await patchTeamSlotRuleOverride(
        shareId,
        userId,
        body && typeof body === 'object' ? (body as { slotRuleOverride?: unknown }).slotRuleOverride : undefined,
        {
          createDbClient: deps.createDbClient,
          generateId: deps.generateId
        }
      );

      return Response.json(payload);
    } catch (error) {
      return errorResponse(error, 'Failed to update team slot rules.');
    }
  };
}

export function createTeamSlotRulesDeleteHandler(deps: TeamSlotRulesRouteDeps) {
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
      const payload = await resetTeamSlotRuleOverride(shareId, userId, {
        createDbClient: deps.createDbClient
      });

      return Response.json(payload);
    } catch (error) {
      return errorResponse(error, 'Failed to reset team slot rules.');
    }
  };
}
