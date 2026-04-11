import { redirect } from 'next/navigation';
import HomePageClient from '../_components/home-page-client';

type HomePageProps = {
  searchParams?: Promise<{ auth?: string | string[] }>;
};

async function resolveHomeSession() {
  const { auth } = await import('@/infrastructure/auth/auth-options');
  return auth();
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await resolveHomeSession();
  if (session?.user) {
    redirect('/teams');
  }

  const resolvedSearchParams = (await searchParams) || {};
  const authParam = resolvedSearchParams.auth;
  const authStatusFromQuery = Array.isArray(authParam) ? authParam[0] : authParam || null;

  return <HomePageClient authStatusFromQuery={authStatusFromQuery} />;
}
