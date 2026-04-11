import { NextRequest, NextResponse } from 'next/server';
import type { createDbClient } from '@/infrastructure/db/client';
import type { isSameOriginRequest } from '@/interface/http/request';
import { toAvatarProxyUrl } from '@/interface/http/avatar-proxy';
import { errorResponse, forbidden, unauthorized } from '@/interface/http/responses';
import { createTeam } from '@/application/usecases/team-page';
import { listTeamsForUser } from '@/application/usecases/team-list';

type TeamsRouteDeps = {
  auth: () => Promise<any>;
  createDbClient: typeof createDbClient;
  generateId: () => string;
  generateMemberPublicId: () => string;
  generateShareId: () => string;
  isSameOriginRequest: typeof isSameOriginRequest;
};

export function createTeamsGetHandler(deps: TeamsRouteDeps) {
  return async function GET() {
    try {
      const session = await deps.auth();
      const userId = String(session?.user?.id || '').trim();
      if (!userId) {
        return unauthorized();
      }

      const payload = await listTeamsForUser(deps.createDbClient, { userId });
      return NextResponse.json({
        teams: payload.teams.map((team: (typeof payload.teams)[number]) => ({
          ...team,
          members: team.members.map((member: (typeof team.members)[number]) => ({
            ...member,
            picture: toAvatarProxyUrl(member.picture)
          }))
        }))
      });
    } catch (error) {
      return errorResponse(error, 'Failed to load teams.');
    }
  };
}

export function createTeamsPostHandler(deps: TeamsRouteDeps) {
  return async function POST(request: NextRequest) {
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
      const payload = await createTeam(deps.createDbClient, {
        userId,
        name: body?.name,
        generateId: deps.generateId,
        generateShareId: deps.generateShareId,
        generateMemberPublicId: deps.generateMemberPublicId
      });

      return NextResponse.json(payload, { status: 201 });
    } catch (error) {
      return errorResponse(error, 'Failed to create team.');
    }
  };
}
