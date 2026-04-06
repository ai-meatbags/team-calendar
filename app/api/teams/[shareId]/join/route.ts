import crypto from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/infrastructure/auth/auth-options';
import { getServerRuntime } from '@/composition/server-runtime';
import { normalizeTeamPrivacy, TEAM_PRIVACY_PRIVATE } from '@/domain/privacy/team-privacy';
import { isSameOriginRequest } from '@/interface/http/request';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ shareId: string }> }
) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
  }

  const { shareId } = await context.params;
  const { db, schema } = getServerRuntime().dbClient;

  const teams = await (db as any)
    .select()
    .from((schema as any).teams)
    .where(eq((schema as any).teams.shareId, shareId))
    .limit(1);

  const team = teams[0];
  if (!team) {
    return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
  }

  if (normalizeTeamPrivacy(team.privacy) === TEAM_PRIVACY_PRIVATE) {
    return NextResponse.json({ error: 'Team is private.' }, { status: 403 });
  }

  const exists = await (db as any)
    .select()
    .from((schema as any).teamMembers)
    .where(
      and(
        eq((schema as any).teamMembers.teamId, team.id),
        eq((schema as any).teamMembers.userId, userId)
      )
    )
    .limit(1);

  if (!exists[0]) {
    await (db as any).insert((schema as any).teamMembers).values({
      id: crypto.randomUUID(),
      teamId: team.id,
      userId,
      memberPublicId: crypto.randomBytes(12).toString('base64url'),
      calendarSelection: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  return NextResponse.json({ joined: true });
}
