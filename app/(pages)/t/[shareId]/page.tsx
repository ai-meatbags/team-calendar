import { Suspense } from 'react';
import TeamPageClient from '../../../_components/team-page/team-page-client';

interface TeamPageProps {
  params: Promise<{ shareId: string }>;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const resolved = await params;

  return (
    <Suspense
      fallback={
        <section className="panel team-panel">
          <h1>Загружаем команду…</h1>
        </section>
      }
    >
      <TeamPageClient shareId={resolved.shareId} />
    </Suspense>
  );
}
