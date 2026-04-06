export function normalizeTeamPrivacy(value: unknown): 'public' | 'private';

export function canRenderJoinButton(params: {
  hasUser: boolean;
  isMember: boolean;
  canJoin: boolean;
}): boolean;

export function getMemberDisplayName(member: {
  name?: string | null;
  [key: string]: unknown;
}): string;

export function getMemberStableKey(member: {
  id?: string | null;
  memberPublicId?: string | null;
  [key: string]: unknown;
}, index: number): string;
