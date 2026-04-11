'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from './app-context';
import { HeaderAvatar } from './header-avatar';
import { HeaderTeamsMenu } from './header-teams-menu';
import { HeaderUserMenu } from './header-user-menu';
import { useHeaderMenus } from './use-header-menus';

export function Header() {
  const { currentUser, openAuthPopup, logout, apiFetch } = useApp();
  const pathname = usePathname();
  const hasUser = Boolean(currentUser);
  const label = currentUser?.name || currentUser?.email || 'Пользователь';
  const {
    teamsMenuRef,
    userMenuRef,
    openMenu,
    teams,
    hasTeamsLoaded,
    handleMenuMouseEnter,
    handleMenuMouseLeave,
    handleMenuTriggerClick,
    closeMenus
  } = useHeaderMenus({
    hasUser,
    pathname,
    apiFetch
  });

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
            Продолжить с Google
          </button>
        )}
        {hasUser && (
          <>
            <HeaderTeamsMenu
              menuRef={teamsMenuRef}
              isOpen={openMenu === 'teams'}
              teams={teams}
              hasTeamsLoaded={hasTeamsLoaded}
              onMouseEnter={() => handleMenuMouseEnter('teams')}
              onMouseLeave={handleMenuMouseLeave}
              onTriggerClick={() => handleMenuTriggerClick('teams')}
              onItemClick={closeMenus}
            />
            <HeaderUserMenu
              menuRef={userMenuRef}
              isOpen={openMenu === 'user'}
              label={label}
              avatar={<HeaderAvatar picture={currentUser?.picture} label={label} />}
              teams={teams}
              hasTeamsLoaded={hasTeamsLoaded}
              onMouseEnter={() => handleMenuMouseEnter('user')}
              onMouseLeave={handleMenuMouseLeave}
              onTriggerClick={() => handleMenuTriggerClick('user')}
              onItemClick={closeMenus}
              onLogoutClick={() => {
                closeMenus();
                logout();
              }}
            />
          </>
        )}
      </div>
    </header>
  );
}
