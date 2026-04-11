'use client';

import React from 'react';
import { useState } from 'react';
import { LandingView } from './landing-view';

export default function HomePageClient({
  authStatusFromQuery
}: {
  authStatusFromQuery?: string | null;
}) {
  const [authStatus] = useState(() => {
    if (authStatusFromQuery === 'google-calendar-recovery') {
      return 'Доступ к Google Calendar нужно подтвердить заново. Продолжите с Google, чтобы восстановить доступ.';
    }
    return '';
  });
  return <LandingView status={authStatus} />;
}
