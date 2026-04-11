'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  normalizeDurationQuery,
  patchSearchParams,
  resolveMemberQuery
} from './team-page-query-state';
import {
  DEFAULT_DURATION_MINUTES,
  type TeamMember
} from './team-page-types';
import { buildTeamPageSearchHref, type ApiFetch } from './team-page-state';

type TeamPageResponse = {
  team?: {
    name?: string;
    shareId?: string;
    privacy?: string;
  };
  members?: TeamMember[];
  isMember?: boolean;
  isOwner?: boolean;
  canJoin?: boolean;
};

export function useTeamPageCore({ shareId, apiFetch }: { shareId: string; apiFetch: ApiFetch }) {
  const [teamData, setTeamData] = useState<TeamPageResponse | null>(null);
  const [teamName, setTeamName] = useState('');
  const [notFound, setNotFound] = useState(false);

  const applyTeamName = useCallback((name: string) => {
    setTeamName(name);
  }, []);

  const loadTeam = useCallback(async () => {
    if (!shareId) {
      return;
    }

    try {
      const data = (await apiFetch(`/api/teams/${shareId}`)) as TeamPageResponse;
      setTeamData(data);
      applyTeamName(data.team?.name || '');
      setNotFound(false);
    } catch {
      setNotFound(true);
    }
  }, [apiFetch, applyTeamName, shareId]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  return {
    teamData,
    teamName,
    applyTeamName,
    refresh: loadTeam,
    notFound
  };
}

function useMutableTeamSearchParams() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const setTeamSearchParams = useCallback(
    (patchFn: (next: URLSearchParams) => void, options?: { replace?: boolean }) => {
      const next = patchSearchParams(searchParams, patchFn);
      if (next === searchParams) {
        return;
      }

      const href = buildTeamPageSearchHref(pathname, next as URLSearchParams);
      if (options?.replace) {
        router.replace(href);
        return;
      }
      router.push(href);
    },
    [pathname, router, searchParams]
  );

  return {
    searchParams,
    setTeamSearchParams
  };
}

export function useDurationFilter() {
  const { searchParams, setTeamSearchParams } = useMutableTeamSearchParams();
  const rawDuration = searchParams.get('duration');
  const { value: duration, isValid } = useMemo(
    () => normalizeDurationQuery(rawDuration, DEFAULT_DURATION_MINUTES),
    [rawDuration]
  );

  useEffect(() => {
    if (isValid && rawDuration === String(duration)) {
      return;
    }

    setTeamSearchParams((next) => {
      next.set('duration', String(duration));
    }, { replace: true });
  }, [duration, isValid, rawDuration, setTeamSearchParams]);

  const setDuration = useCallback((nextDuration: unknown) => {
    const normalized = normalizeDurationQuery(nextDuration, duration);
    setTeamSearchParams((next) => {
      next.set('duration', String(normalized.value));
    });
  }, [duration, setTeamSearchParams]);

  return {
    duration,
    setDuration
  };
}

export function useMemberFilter({
  members,
  isEnabled
}: {
  members: TeamMember[];
  isEnabled: boolean;
}) {
  const { searchParams, setTeamSearchParams } = useMutableTeamSearchParams();
  const rawMemberQuery = searchParams.get('member');
  const { selectedMemberPublicId, isValid } = useMemo(
    () => resolveMemberQuery(rawMemberQuery, members),
    [members, rawMemberQuery]
  );

  useEffect(() => {
    if (!isEnabled || !rawMemberQuery || isValid) {
      return;
    }

    setTeamSearchParams((next) => {
      next.delete('member');
    }, { replace: true });
  }, [isEnabled, isValid, rawMemberQuery, setTeamSearchParams]);

  const setMemberFilter = useCallback((memberPublicId: string | null) => {
    const normalizedId = String(memberPublicId || '').trim();
    setTeamSearchParams((next) => {
      if (normalizedId) {
        next.set('member', normalizedId);
        return;
      }
      next.delete('member');
    });
  }, [setTeamSearchParams]);

  return {
    selectedMemberPublicId,
    setMemberFilter
  };
}
