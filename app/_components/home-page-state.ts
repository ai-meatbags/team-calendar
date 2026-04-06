export type HomeMode = 'teams' | 'create';

export const LANDING_SCREENSHOT_PATH = '/img/screen.png';

export function resolveHomeMode(params: {
  openCreateFromQuery: boolean;
  teamsCount: number;
}): HomeMode {
  if (params.openCreateFromQuery || params.teamsCount === 0) {
    return 'create';
  }

  return 'teams';
}

export function resolveCreateBackMode(): HomeMode {
  return 'teams';
}

export function buildCreatedTeamPath(shareId: string) {
  return `/t/${shareId}`;
}
