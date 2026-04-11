'use client';

import React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useApp } from './app-context';
import type { TeamSummary } from './header-model';
import { TeamsView } from './teams-view';

export default function TeamsPageClient() {
  const { currentUser, isLoading, apiFetch, showToast } = useApp();
  const [teams, setTeams] = useState<TeamSummary[]>([]);

  const loadTeams = useCallback(async () => {
    try {
      const data = (await apiFetch('/api/teams')) as { teams?: TeamSummary[] };
      setTeams(Array.isArray(data?.teams) ? data.teams : []);
    } catch {
      showToast('Не удалось загрузить команды');
    }
  }, [apiFetch, showToast]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    void loadTeams();
  }, [currentUser, loadTeams]);

  if (isLoading || !currentUser) {
    return null;
  }

  return <TeamsView teams={teams} />;
}
