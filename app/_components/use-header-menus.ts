'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TeamSummary } from './header-model';

function canUseHover() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

export function useHeaderMenus({
  hasUser,
  pathname,
  apiFetch
}: {
  hasUser: boolean;
  pathname: string | null;
  apiFetch: (path: string, options?: RequestInit) => Promise<unknown>;
}) {
  const teamsMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const hoverCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const teamsPrefetchedRef = useRef(false);
  const teamsRequestRef = useRef<Promise<void> | null>(null);
  const [openMenu, setOpenMenu] = useState<'teams' | 'user' | null>(null);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [hasTeamsLoaded, setHasTeamsLoaded] = useState(false);

  const clearHoverCloseTimer = useCallback(() => {
    if (!hoverCloseTimerRef.current) {
      return;
    }

    clearTimeout(hoverCloseTimerRef.current);
    hoverCloseTimerRef.current = null;
  }, []);

  useEffect(() => {
    clearHoverCloseTimer();
    setOpenMenu(null);
  }, [clearHoverCloseTimer, pathname]);

  useEffect(() => () => clearHoverCloseTimer(), [clearHoverCloseTimer]);

  useEffect(() => {
    if (!openMenu) {
      return;
    }

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      const isInsideTeamsMenu = Boolean(teamsMenuRef.current?.contains(target));
      const isInsideUserMenu = Boolean(userMenuRef.current?.contains(target));
      if (!isInsideTeamsMenu && !isInsideUserMenu) {
        clearHoverCloseTimer();
        setOpenMenu(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        clearHoverCloseTimer();
        setOpenMenu(null);
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
  }, [clearHoverCloseTimer, openMenu]);

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
    if (hasUser && openMenu && !hasTeamsLoaded) {
      void fetchTeamsList();
    }
  }, [fetchTeamsList, hasTeamsLoaded, hasUser, openMenu]);

  const handleMenuMouseEnter = useCallback(
    (menu: 'teams' | 'user') => {
      if (hasUser && canUseHover()) {
        clearHoverCloseTimer();
        setOpenMenu(menu);
      }
    },
    [clearHoverCloseTimer, hasUser]
  );

  const handleMenuMouseLeave = useCallback(() => {
    if (canUseHover()) {
      clearHoverCloseTimer();
      hoverCloseTimerRef.current = setTimeout(() => {
        hoverCloseTimerRef.current = null;
        setOpenMenu(null);
      }, 120);
    }
  }, [clearHoverCloseTimer]);

  const handleMenuTriggerClick = useCallback(
    (menu: 'teams' | 'user') => {
      if (!hasUser) {
        return;
      }
      clearHoverCloseTimer();
      setOpenMenu((current) => (current === menu ? null : menu));
    },
    [clearHoverCloseTimer, hasUser]
  );

  const closeMenus = useCallback(() => {
    clearHoverCloseTimer();
    setOpenMenu(null);
  }, [clearHoverCloseTimer]);

  return {
    teamsMenuRef,
    userMenuRef,
    openMenu,
    teams,
    hasTeamsLoaded,
    handleMenuMouseEnter,
    handleMenuMouseLeave,
    handleMenuTriggerClick,
    closeMenus
  };
}
