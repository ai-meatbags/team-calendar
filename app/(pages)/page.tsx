import HomePageClient from '../_components/home-page-client';

type HomePageProps = {
  searchParams?: Promise<{ auth?: string | string[] }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  const authParam = resolvedSearchParams.auth;
  const authStatusFromQuery = Array.isArray(authParam) ? authParam[0] : authParam || null;

  return <HomePageClient authStatusFromQuery={authStatusFromQuery} />;
}
