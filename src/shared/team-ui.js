export function normalizeTeamPrivacy(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'private' ? 'private' : 'public';
}

export function canRenderJoinButton({ hasUser, isMember, canJoin }) {
  return Boolean(hasUser && !isMember && canJoin);
}

export function getMemberDisplayName(member) {
  const value = String(member?.name || '').trim();
  return value || 'Участник';
}

export function getMemberStableKey(member, index) {
  if (
    member?.memberPublicId !== undefined &&
    member?.memberPublicId !== null &&
    member?.memberPublicId !== ''
  ) {
    return String(member.memberPublicId);
  }
  if (member?.id !== undefined && member?.id !== null && member?.id !== '') {
    return String(member.id);
  }
  return `member-${index}`;
}
