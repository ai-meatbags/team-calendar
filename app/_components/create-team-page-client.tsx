'use client';

import React from 'react';
import { useCallback, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './app-context';
import { CreateTeamView } from './create-team-view';
import { buildCreatedTeamPath } from './home-page-state';

export default function CreateTeamPageClient() {
  const { apiFetch } = useApp();
  const [status, setStatus] = useState('');
  const router = useRouter();

  const handleCreateSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const name = String(formData.get('name') || '').trim();
      if (!name) {
        setStatus('Введите имя команды.');
        return;
      }

      setStatus('Создаем команду...');
      try {
        const team = (await apiFetch('/api/teams', {
          method: 'POST',
          body: JSON.stringify({ name })
        })) as { shareId: string };
        router.push(buildCreatedTeamPath(team.shareId));
      } catch {
        setStatus('Не удалось создать команду.');
      }
    },
    [apiFetch, router]
  );

  return <CreateTeamView status={status} onSubmit={handleCreateSubmit} />;
}
