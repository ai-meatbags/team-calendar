import { redirect } from 'next/navigation';
import ProfilePageClient from '../../_components/profile-page-client';

export const dynamic = 'force-dynamic';

async function resolveProfileSession() {
  const { auth } = await import('@/infrastructure/auth/auth-options');
  return auth();
}

export default async function ProfilePage() {
  const session = await resolveProfileSession();
  if (!session?.user) {
    redirect('/');
  }
  return <ProfilePageClient />;
}
