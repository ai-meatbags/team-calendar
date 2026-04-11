'use client';

import React from 'react';
import Link from 'next/link';
import { shouldShowEmptyTeamsMessage, type TeamSummary } from './header-model';

export function HeaderTeamsMenu({
  menuRef,
  isOpen,
  teams,
  hasTeamsLoaded,
  onMouseEnter,
  onMouseLeave,
  onTriggerClick,
  onItemClick
}: {
  menuRef: React.RefObject<HTMLDivElement>;
  isOpen: boolean;
  teams: TeamSummary[];
  hasTeamsLoaded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onTriggerClick: () => void;
  onItemClick: () => void;
}) {
  return (
    <div
      className={`teams-menu ${isOpen ? 'is-open' : ''}`}
      ref={menuRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        className="teams-menu__trigger"
        type="button"
        aria-label="Мои команды"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={onTriggerClick}
      >
        Мои команды
      </button>

      <div className="user-menu__dropdown teams-menu__dropdown" role="menu" aria-label="Мои команды">
        <div className="user-menu__header teams-menu__header">
          <Link
            className="user-menu__item teams-menu__header-link"
            href="/teams"
            role="menuitem"
            title="Мои команды"
            onClick={onItemClick}
          >
            Мои команды
          </Link>
        </div>
        <div className="user-menu__branch teams-menu__branch" role="group" aria-label="Список команд">
          {shouldShowEmptyTeamsMessage({ hasTeamsLoaded, teamsCount: teams.length }) ? (
            <span className="user-menu__branch-item teams-menu__item--muted">Пока нет команд</span>
          ) : null}
          {teams.map((team) => (
            <Link
              className="user-menu__branch-item"
              key={team.shareId}
              href={`/t/${team.shareId}`}
              role="menuitem"
              onClick={onItemClick}
            >
              {team.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
