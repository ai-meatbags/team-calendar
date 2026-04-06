import HomePageClient from '../_components/home-page-client';

type HomePageProps = {
  searchParams?: Promise<{ create?: string | string[] }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  const createParam = resolvedSearchParams.create;
  const openCreateFromQuery =
    Array.isArray(createParam) ? createParam.includes('1') : createParam === '1';

  return <HomePageClient openCreateFromQuery={openCreateFromQuery} />;
}
