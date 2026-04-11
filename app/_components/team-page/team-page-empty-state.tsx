'use client';

import React from 'react';
import Link from 'next/link';

export function NotFoundPanel() {
  return (
    <section className="panel team-panel">
      <h2>Команда не найдена</h2>
      <p className="panel__meta">
        Вернуться к <Link href="/">списку команд</Link>.
      </p>
    </section>
  );
}
