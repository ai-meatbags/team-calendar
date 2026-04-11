'use client';

import React from 'react';
import { HomeCreateTeamCard } from './home-create-team-card';
import { HomeTeamCard } from './home-team-card';
import type { TeamSummary } from './header-model';

export function TeamsView({ teams }: { teams: TeamSummary[] }) {
  const totalCards = teams.length + 1;

  return (
    <section className="panel profile-settings-card teams-panel">
      <header className="profile-settings-card__header">
        <div>
          <h1>Мои команды</h1>
        </div>
      </header>
      <div className={`team-list ${totalCards <= 2 ? 'team-list--two-up' : ''}`}>
        <HomeCreateTeamCard />
        {teams.map((team) => (
          <HomeTeamCard key={team.shareId} team={team} />
        ))}
      </div>
    </section>
  );
}
