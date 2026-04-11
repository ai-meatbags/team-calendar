'use client';

import React from 'react';
import { LANDING_SCREENSHOT_PATH } from './home-page-state';

export function LandingView({ status }: { status: string }) {
  return (
    <section className="hero">
      <p className="eyebrow">Google Calendar · Free/Busy</p>
      <h1>Выбери время встречи, когда свободны все — одним взглядом.</h1>
      <p className="hero__subtitle">
        Создай команду, поделись ссылкой, и смотри пересечение по времени для всех участников одним взглядом.
        Войдём в существующий аккаунт или создадим новый автоматически.
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
      {status ? <div className="status">{status}</div> : null}
    </section>
  );
}
