import { redirect } from 'next/navigation';
import TeamSettingsPageClient from '../../../../_components/team-page/team-settings-page-client';

export const dynamic = 'force-dynamic';

async function resolveTeamSettingsSession() {
  const { auth } = await import('@/infrastructure/auth/auth-options');
  return auth();
}

export default async function TeamSettingsPage({
  params
}: {
  params: Promise<{ shareId: string }>;
}) {
  const resolved = await params;
  const session = await resolveTeamSettingsSession();

  if (!session?.user) {
    redirect(`/t/${resolved.shareId}`);
  }

  return <TeamSettingsPageClient shareId={resolved.shareId} />;
}
