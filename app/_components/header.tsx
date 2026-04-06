'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from './app-context';
import { CreateTeamIcon } from './icons/create-team-icon';
import { LogoutIcon } from './icons/logout-icon';
import { ProfileIcon } from './icons/profile-icon';
import { TeamsIcon } from './icons/teams-icon';
import {
  buildUserMenuModel,
  resolveUserMenuState,
  shouldShowEmptyTeamsMessage,
  type TeamSummary
} from './header-model';

function canUseHover() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

export function Header() {
  const { currentUser, openAuthPopup, logout, apiFetch } = useApp();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const hoverCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const teamsPrefetchedRef = useRef(false);
  const teamsRequestRef = useRef<Promise<void> | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [hasTeamsLoaded, setHasTeamsLoaded] = useState(false);

  const hasUser = Boolean(currentUser);
  const label = currentUser?.name || currentUser?.email || 'Пользователь';
  const menuModel = buildUserMenuModel(teams);

  function clearHoverCloseTimer() {
    if (!hoverCloseTimerRef.current) {
      return;
    }

    clearTimeout(hoverCloseTimerRef.current);
    hoverCloseTimerRef.current = null;
  }

  useEffect(() => {
    clearHoverCloseTimer();
    setIsMenuOpen((prev) =>
      resolveUserMenuState({
        action: 'route-change',
        hasUser,
        isOpen: prev,
        canUseHover: canUseHover()
      })
    );
  }, [pathname]);

  useEffect(() => {
    return () => {
      clearHoverCloseTimer();
    };
  }, []);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!menuRef.current) {
        return;
      }

      if (!menuRef.current.contains(event.target as Node)) {
        clearHoverCloseTimer();
        setIsMenuOpen((prev) =>
          resolveUserMenuState({
            action: 'outside-click',
            hasUser,
            isOpen: prev,
            canUseHover: canUseHover()
          })
        );
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        clearHoverCloseTimer();
        setIsMenuOpen((prev) =>
          resolveUserMenuState({
            action: 'escape',
            hasUser,
            isOpen: prev,
            canUseHover: canUseHover()
          })
        );
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  const fetchTeamsList = useCallback(() => {
    if (!hasUser) {
      return Promise.resolve();
    }

    if (teamsRequestRef.current) {
      return teamsRequestRef.current;
    }

    if (teamsPrefetchedRef.current) {
      return Promise.resolve();
    }

    teamsRequestRef.current = apiFetch('/api/teams')
      .then((data) => {
        const nextTeams =
          data && typeof data === 'object' && Array.isArray((data as { teams?: TeamSummary[] }).teams)
            ? ((data as { teams?: TeamSummary[] }).teams as TeamSummary[])
            : [];
        setTeams(nextTeams);
      })
      .catch(() => {
        setTeams([]);
      })
      .finally(() => {
        teamsPrefetchedRef.current = true;
        teamsRequestRef.current = null;
        setHasTeamsLoaded(true);
      });

    return teamsRequestRef.current;
  }, [apiFetch, hasUser]);

  useEffect(() => {
    if (!hasUser) {
      setTeams([]);
      setHasTeamsLoaded(false);
      teamsPrefetchedRef.current = false;
      teamsRequestRef.current = null;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void fetchTeamsList();
    }, 250);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [fetchTeamsList, hasUser]);

  useEffect(() => {
    if (hasUser && isMenuOpen && !hasTeamsLoaded) {
      void fetchTeamsList();
    }
  }, [fetchTeamsList, hasTeamsLoaded, hasUser, isMenuOpen]);

  function handleMouseEnter() {
    if (hasUser && canUseHover()) {
      clearHoverCloseTimer();
      setIsMenuOpen((prev) =>
        resolveUserMenuState({
          action: 'hover-enter',
          hasUser,
          isOpen: prev,
          canUseHover: true
        })
      );
    }
  }

  function handleMouseLeave() {
    if (canUseHover()) {
      clearHoverCloseTimer();
      hoverCloseTimerRef.current = setTimeout(() => {
        hoverCloseTimerRef.current = null;
        setIsMenuOpen((prev) =>
          resolveUserMenuState({
            action: 'hover-timeout',
            hasUser,
            isOpen: prev,
            canUseHover: true
          })
        );
      }, 120);
    }
  }

  function handleTriggerClick() {
    if (!hasUser) {
      return;
    }

    if (canUseHover()) {
      return;
    }

    setIsMenuOpen((prev) =>
      resolveUserMenuState({
        action: 'trigger-click',
        hasUser,
        isOpen: prev,
        canUseHover: false
      })
    );
  }

  function handleMenuItemClick() {
    clearHoverCloseTimer();
    setIsMenuOpen((prev) =>
      resolveUserMenuState({
        action: 'select-item',
        hasUser,
        isOpen: prev,
        canUseHover: canUseHover()
      })
    );
  }

  function handleLogoutClick() {
    clearHoverCloseTimer();
    setIsMenuOpen((prev) =>
      resolveUserMenuState({
        action: 'select-item',
        hasUser,
        isOpen: prev,
        canUseHover: canUseHover()
      })
    );
    logout();
  }

  function renderAvatar() {
    if (currentUser?.picture) {
      return (
        <img
          className="user-menu__avatar"
          src={currentUser.picture}
          alt={`Аватар ${label}`}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      );
    }

    return (
      <span className="user-menu__avatar user-menu__avatar--fallback" aria-hidden="true">
        <ProfileIcon />
      </span>
    );
  }

  return (
    <header className="topbar">
      <Link className="brand" href="/">
        <span className="brand__mark" />
        Team Calendar
      </Link>
      <div className="topbar__actions">
        {!hasUser && (
          <button
            className="btn btn--ghost transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent/40"
            type="button"
            onClick={openAuthPopup}
          >
            Войти через Google
          </button>
        )}
        {hasUser && (
          <div
            className={`user-menu ${isMenuOpen ? 'is-open' : ''}`}
            ref={menuRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              className="user-menu__trigger"
              type="button"
              aria-label={`Меню пользователя ${label}`}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              onClick={handleTriggerClick}
            >
              {renderAvatar()}
            </button>

            <div className="user-menu__dropdown" role="menu" aria-label="Меню пользователя">
              <div className="user-menu__header">
                <div className="user-menu__name" title={label}>
                  {label}
                </div>
                <span className="user-menu__header-avatar-slot" aria-hidden="true" />
              </div>

              <Link className="user-menu__item" href={menuModel.primaryLinks[0].href} role="menuitem" onClick={handleMenuItemClick}>
                <span className="user-menu__icon">
                  <ProfileIcon />
                </span>
                <span>{menuModel.primaryLinks[0].label}</span>
              </Link>
              <Link className="user-menu__item" href={menuModel.primaryLinks[1].href} role="menuitem" onClick={handleMenuItemClick}>
                <span className="user-menu__icon">
                  <TeamsIcon />
                </span>
                <span>{menuModel.primaryLinks[1].label}</span>
              </Link>

              <div className="user-menu__branch" role="group" aria-label="Список команд">
                {shouldShowEmptyTeamsMessage({ hasTeamsLoaded, teamsCount: teams.length }) && (
                  <span className="user-menu__branch-item user-menu__branch-item--muted">Пока нет команд</span>
                )}
                {menuModel.teamLinks.map((team) => (
                  <Link
                    className="user-menu__branch-item"
                    key={team.href}
                    href={team.href}
                    role="menuitem"
                    onClick={handleMenuItemClick}
                  >
                    {team.label}
                  </Link>
                ))}
              </div>

              <Link className="user-menu__item" href={menuModel.createLink.href} role="menuitem" onClick={handleMenuItemClick}>
                <span className="user-menu__icon">
                  <CreateTeamIcon />
                </span>
                <span>{menuModel.createLink.label}</span>
              </Link>
              <button className="user-menu__item" type="button" role="menuitem" onClick={handleLogoutClick}>
                <span className="user-menu__icon">
                  <LogoutIcon />
                </span>
                <span>{menuModel.logoutLabel}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
