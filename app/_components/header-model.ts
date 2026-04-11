export type TeamSummary = {
  members: Array<{
    name: string;
    picture: string | null;
  }>;
  myAvailability: {
    workdayStartHour: number;
    workdayEndHour: number;
  } | null;
  name: string;
  shareId: string;
};

export type UserMenuAction =
  | 'hover-enter'
  | 'trigger-click'
  | 'outside-click'
  | 'escape'
  | 'select-item'
  | 'route-change'
  | 'hover-timeout';

export function buildUserMenuModel(teams: TeamSummary[]) {
  return {
    primaryLinks: [
      { href: '/profile', label: 'Профиль' },
      { href: '/teams', label: 'Все команды' }
    ],
    teamLinks: teams.map((team) => ({
      href: `/t/${team.shareId}`,
      label: team.name
    })),
    createLink: { href: '/teams/new', label: 'Создать команду' },
    logoutLabel: 'Выйти'
  };
}

export function shouldShowEmptyTeamsMessage(params: { hasTeamsLoaded: boolean; teamsCount: number }) {
  return params.hasTeamsLoaded && params.teamsCount === 0;
}

export function resolveUserMenuState(params: {
  action: UserMenuAction;
  hasUser: boolean;
  isOpen: boolean;
  canUseHover: boolean;
}) {
  if (!params.hasUser) {
    return false;
  }

  switch (params.action) {
    case 'hover-enter':
      return params.canUseHover ? true : params.isOpen;
    case 'trigger-click':
      return params.canUseHover ? params.isOpen : !params.isOpen;
    case 'outside-click':
    case 'escape':
    case 'select-item':
    case 'route-change':
    case 'hover-timeout':
      return false;
    default:
      return params.isOpen;
  }
}
