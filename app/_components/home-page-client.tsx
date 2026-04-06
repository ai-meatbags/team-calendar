'use client';

import React from 'react';
import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './app-context';
import {
  buildCreatedTeamPath,
  LANDING_SCREENSHOT_PATH,
  resolveCreateBackMode,
  resolveHomeMode
} from './home-page-state';
import type { TeamSummary } from './header-model';

export function LandingView({ status }: { status: string }) {
  return (
    <section className="hero">
      <p className="eyebrow">Google Calendar · Free/Busy</p>
      <h1>Выбери время встречи, когда свободны все — одним взглядом.</h1>
      <p className="hero__subtitle">
        Создай команду, поделись ссылкой, и смотри пересечение по времени для всех участников одним взглядом.
      </p>
      <div className="hero-media">
        <img src={LANDING_SCREENSHOT_PATH} alt="Скриншот Team Calendar" loading="lazy" />
      </div>
      <div className="trust-grid">
        <div className="trust-card">
          <h3>Мы не читаем события</h3>
          <p>Никаких названий, описаний или участников встреч.</p>
        </div>
        <div className="trust-card">
          <h3>Только свободное время</h3>
          <p>Используем Google доступ Free/Busy, чтобы узнать, когда вы свободны.</p>
        </div>
      </div>
      <div className="status">{status}</div>
    </section>
  );
}

export function TeamsView({
  teams,
  onCreate
}: {
  teams: TeamSummary[];
  onCreate: () => void;
}) {
  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <h2>Мои команды</h2>
          <p className="panel__meta">Открой нужную команду или создай новую.</p>
        </div>
        <button
          className="btn btn--ghost transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent/40"
          type="button"
          onClick={onCreate}
        >
          Создать команду
        </button>
      </div>
      <div className="team-list">
        {teams.map((team) => (
          <Link className="team-card" key={team.shareId} href={`/t/${team.shareId}`}>
            <h3>{team.name}</h3>
            <p className="team-card__meta">
              Открыть команду
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="team-card__icon"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function CreateView({
  onBack,
  onSubmit,
  status
}: {
  onBack: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  status: string;
}) {
  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <h2>Новая команда</h2>
          <p className="panel__meta">Название нужно только для ориентира.</p>
        </div>
        <button
          className="btn btn--ghost transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent/40"
          type="button"
          onClick={onBack}
        >
          Назад
        </button>
      </div>
      <form className="form" onSubmit={(event) => void onSubmit(event)}>
        <label className="field">
          <span>Имя команды</span>
          <input
            className="w-full focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition"
            type="text"
            name="name"
            placeholder="Например: Партнеры"
            required
          />
        </label>
        <button
          className="btn btn--primary transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent/40"
          type="submit"
        >
          Создать
        </button>
      </form>
      <div className="status">{status}</div>
    </section>
  );
}

export default function HomePageClient({
  openCreateFromQuery
}: {
  openCreateFromQuery: boolean;
}) {
  const { currentUser, isLoading, apiFetch, showToast } = useApp();
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [mode, setMode] = useState<'teams' | 'create'>('teams');
  const [authStatus] = useState('');
  const [createStatus, setCreateStatus] = useState('');
  const router = useRouter();

  const loadTeams = useCallback(async () => {
    try {
      const data = (await apiFetch('/api/teams')) as { teams?: TeamSummary[] };
      const list = Array.isArray(data?.teams) ? data.teams : [];
      setTeams(list);
      setMode(resolveHomeMode({ openCreateFromQuery, teamsCount: list.length }));
    } catch {
      showToast('Не удалось загрузить команды');
    }
  }, [apiFetch, openCreateFromQuery, showToast]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    void loadTeams();
  }, [currentUser, loadTeams]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setMode(resolveHomeMode({ openCreateFromQuery, teamsCount: teams.length }));
  }, [currentUser, openCreateFromQuery, teams.length]);

  const handleCreateSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') || '').trim();
    if (!name) {
      setCreateStatus('Введите имя команды.');
      return;
    }

    setCreateStatus('Создаем команду...');
    try {
      const team = (await apiFetch('/api/teams', {
        method: 'POST',
        body: JSON.stringify({ name })
      })) as { shareId: string };
      router.push(buildCreatedTeamPath(team.shareId));
    } catch {
      setCreateStatus('Не удалось создать команду.');
    }
  }, [apiFetch, router]);

  if (isLoading) {
    return null;
  }

  if (!currentUser) {
    return <LandingView status={authStatus} />;
  }

  if (mode === 'create') {
    return (
      <CreateView
        status={createStatus}
        onBack={() => {
          if (openCreateFromQuery) {
            router.replace('/');
            return;
          }
          setMode(resolveCreateBackMode());
        }}
        onSubmit={handleCreateSubmit}
      />
    );
  }

  return <TeamsView teams={teams} onCreate={() => setMode('create')} />;
}
