import { redirect } from 'next/navigation';
import CreateTeamPageClient from '../../../_components/create-team-page-client';

export const dynamic = 'force-dynamic';

async function resolveCreateTeamSession() {
  const { auth } = await import('@/infrastructure/auth/auth-options');
  return auth();
}

export default async function CreateTeamPage() {
  const session = await resolveCreateTeamSession();
  if (!session?.user) {
    redirect('/');
  }

  return <CreateTeamPageClient />;
}
