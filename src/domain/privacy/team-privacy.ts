export const TEAM_PRIVACY_PUBLIC = 'public';
export const TEAM_PRIVACY_PRIVATE = 'private';

export function normalizeTeamPrivacy(value: unknown) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === TEAM_PRIVACY_PRIVATE ? TEAM_PRIVACY_PRIVATE : TEAM_PRIVACY_PUBLIC;
}

export function isValidTeamPrivacy(value: unknown) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === TEAM_PRIVACY_PUBLIC || normalized === TEAM_PRIVACY_PRIVATE;
}

export function buildCanJoin(params: { hasUser: boolean; isMember: boolean; privacy: unknown }) {
  if (!params.hasUser || params.isMember) {
    return false;
  }
  return normalizeTeamPrivacy(params.privacy) === TEAM_PRIVACY_PUBLIC;
}
