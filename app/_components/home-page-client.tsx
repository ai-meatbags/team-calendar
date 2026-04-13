'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './app-context';
import { LandingView } from './landing-view';

export default function HomePageClient({
  authStatusFromQuery
}: {
  authStatusFromQuery?: string | null;
}) {
  const router = useRouter();
  const { currentUser, isLoading } = useApp();
  const [authStatus] = useState(() => {
    if (authStatusFromQuery === 'google-calendar-recovery') {
      return 'Доступ к Google Calendar нужно подтвердить заново. Продолжите с Google, чтобы восстановить доступ.';
    }
    return '';
  });

  useEffect(() => {
    if (!isLoading && currentUser) {
      router.replace('/teams');
    }
  }, [currentUser, isLoading, router]);

  return <LandingView status={authStatus} />;
}
