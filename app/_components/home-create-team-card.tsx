'use client';

import React from 'react';
import Link from 'next/link';

export function HomeCreateTeamCard() {
  return (
    <Link className="team-card team-card--create" href="/teams/new">
      <h3>Создать команду</h3>
    </Link>
  );
}
