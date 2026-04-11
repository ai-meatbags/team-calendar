'use client';

import React, { type FormEvent } from 'react';
import Link from 'next/link';

export function CreateTeamView({
  onSubmit,
  status
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  status: string;
}) {
  return (
    <section className="card profile-settings-card create-team-card">
      <header className="profile-settings-card__header create-team-card__header">
        <div>
          <h1>Новая команда</h1>
        </div>
        <Link className="btn btn--ghost btn--sm" href="/teams">
          Назад
        </Link>
      </header>

      <section className="profile-settings-card__section">
        <form className="profile-settings-card__form" onSubmit={(event) => void onSubmit(event)}>
          <div className="profile-settings-card__group">
            <div className="profile-settings-card__section-copy">
              <h2>Имя команды</h2>
            </div>

            <label className="field" htmlFor="create-team-name">
              <input
                id="create-team-name"
                type="text"
                name="name"
                aria-label="Имя команды"
                placeholder="Например: Партнеры"
                required
              />
            </label>
          </div>

          {status ? <div className="status">{status}</div> : null}

          <div className="profile-settings-card__actions">
            <button className="btn btn--primary btn--sm" type="submit">
              Создать команду
            </button>
          </div>
        </form>
      </section>
    </section>
  );
}
