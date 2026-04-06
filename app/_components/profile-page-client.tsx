'use client';

import React from 'react';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './app-context';
import { shouldRedirectProfile } from './profile-state';

export function ProfilePanel({
  nameDraft,
  isSaving,
  onNameChange,
  onSubmit
}: {
  nameDraft: string;
  isSaving: boolean;
  onNameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <section className="panel profile-panel">
      <div className="panel__header">
        <div>
          <h2>Профиль</h2>
          <p className="panel__meta">Измените отображаемое имя аккаунта.</p>
        </div>
      </div>
      <form className="form" onSubmit={(event) => void onSubmit(event)}>
        <label className="field" htmlFor="profile-name">
          <span>Имя</span>
          <input
            id="profile-name"
            className="w-full focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition"
            type="text"
            name="name"
            autoComplete="name"
            value={nameDraft}
            onChange={(event) => onNameChange(event.target.value)}
            maxLength={80}
            required
          />
        </label>
        <button
          className="btn btn--primary transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent/40"
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </form>
    </section>
  );
}

export default function ProfilePageClient() {
  const { currentUser, isLoading, apiFetch, loadCurrentUser, showToast } = useApp();
  const [nameDraft, setNameDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setNameDraft(String(currentUser.name || '').trim());
  }, [currentUser]);

  useEffect(() => {
    if (shouldRedirectProfile({ hasUser: Boolean(currentUser), isLoading })) {
      router.replace('/');
    }
  }, [currentUser, isLoading, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(nameDraft || '').trim();
    if (!name) {
      showToast('Введите имя.');
      return;
    }

    setIsSaving(true);
    try {
      const data = (await apiFetch('/api/me', {
        method: 'PATCH',
        body: JSON.stringify({ name })
      })) as { name?: string };
      setNameDraft(String(data?.name || name));
      await loadCurrentUser();
      showToast('Имя сохранено.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось сохранить имя.';
      showToast(message || 'Не удалось сохранить имя.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || !currentUser) {
    return null;
  }

  return (
    <ProfilePanel
      isSaving={isSaving}
      nameDraft={nameDraft}
      onNameChange={setNameDraft}
      onSubmit={handleSubmit}
    />
  );
}
