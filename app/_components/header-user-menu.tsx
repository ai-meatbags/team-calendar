'use client';

import React from 'react';
import Link from 'next/link';
import { CreateTeamIcon } from './icons/create-team-icon';
import { LogoutIcon } from './icons/logout-icon';
import { ProfileIcon } from './icons/profile-icon';
import { TeamsIcon } from './icons/teams-icon';
import {
  buildUserMenuModel,
  shouldShowEmptyTeamsMessage,
  type TeamSummary
} from './header-model';

export function HeaderUserMenu({
  menuRef,
  isOpen,
  label,
  avatar,
  teams,
  hasTeamsLoaded,
  onMouseEnter,
  onMouseLeave,
  onTriggerClick,
  onItemClick,
  onLogoutClick
}: {
  menuRef: React.RefObject<HTMLDivElement>;
  isOpen: boolean;
  label: string;
  avatar: React.ReactNode;
  teams: TeamSummary[];
  hasTeamsLoaded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onTriggerClick: () => void;
  onItemClick: () => void;
  onLogoutClick: () => void;
}) {
  const menuModel = buildUserMenuModel(teams);

  return (
    <div
      className={`user-menu ${isOpen ? 'is-open' : ''}`}
      ref={menuRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        className="user-menu__trigger"
        type="button"
        aria-label={`Меню пользователя ${label}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={onTriggerClick}
      >
        {avatar}
      </button>

      <div className="user-menu__dropdown" role="menu" aria-label="Меню пользователя">
        <div className="user-menu__header">
          <div className="user-menu__name" title={label}>
            {label}
          </div>
          <span className="user-menu__header-avatar-slot" aria-hidden="true" />
        </div>

        <Link className="user-menu__item" href={menuModel.primaryLinks[0].href} role="menuitem" onClick={onItemClick}>
          <span className="user-menu__icon">
            <ProfileIcon />
          </span>
          <span>{menuModel.primaryLinks[0].label}</span>
        </Link>
        <Link className="user-menu__item" href={menuModel.primaryLinks[1].href} role="menuitem" onClick={onItemClick}>
          <span className="user-menu__icon">
            <TeamsIcon />
          </span>
          <span>{menuModel.primaryLinks[1].label}</span>
        </Link>

        <div className="user-menu__branch" role="group" aria-label="Список команд">
          {shouldShowEmptyTeamsMessage({ hasTeamsLoaded, teamsCount: teams.length }) ? (
            <span className="user-menu__branch-item user-menu__branch-item--muted">Пока нет команд</span>
          ) : null}
          {menuModel.teamLinks.map((team) => (
            <Link className="user-menu__branch-item" key={team.href} href={team.href} role="menuitem" onClick={onItemClick}>
              {team.label}
            </Link>
          ))}
        </div>

        <Link className="user-menu__item" href={menuModel.createLink.href} role="menuitem" onClick={onItemClick}>
          <span className="user-menu__icon">
            <CreateTeamIcon />
          </span>
          <span>{menuModel.createLink.label}</span>
        </Link>
        <button className="user-menu__item" type="button" role="menuitem" onClick={onLogoutClick}>
          <span className="user-menu__icon">
            <LogoutIcon />
          </span>
          <span>{menuModel.logoutLabel}</span>
        </button>
      </div>
    </div>
  );
}
