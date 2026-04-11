import { redirect } from 'next/navigation';
import TeamsPageClient from '../../_components/teams-page-client';

export const dynamic = 'force-dynamic';

async function resolveTeamsSession() {
  const { auth } = await import('@/infrastructure/auth/auth-options');
  return auth();
}

export default async function TeamsPage() {
  const session = await resolveTeamsSession();
  if (!session?.user) {
    redirect('/');
  }

  return <TeamsPageClient />;
}
