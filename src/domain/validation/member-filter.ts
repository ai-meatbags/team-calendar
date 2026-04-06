export const MEMBER_PUBLIC_ID_PATTERN = /^[A-Za-z0-9_-]{12,64}$/;

export class MemberFilterValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function normalizeMemberPublicId(value: unknown) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

export function isValidMemberPublicId(value: unknown) {
  const normalized = normalizeMemberPublicId(value);
  return Boolean(normalized && MEMBER_PUBLIC_ID_PATTERN.test(normalized));
}

export function requireMemberPublicId(value: unknown, context: { shareId?: string } = {}) {
  const normalized = normalizeMemberPublicId(value);
  if (isValidMemberPublicId(normalized)) return String(normalized);
  throw new Error(`Invalid member_public_id for team member (shareId=${context.shareId || 'unknown'}).`);
}

export function resolveAvailabilityMemberFilter(params: {
  memberFilter: unknown;
  availableMemberPublicIds: string[];
}) {
  const selected = normalizeMemberPublicId(params.memberFilter);
  if (!selected) return { selectedMemberPublicId: null };
  if (!isValidMemberPublicId(selected)) {
    throw new MemberFilterValidationError('Invalid member filter.', 400);
  }

  const allowed = new Set((params.availableMemberPublicIds || []).map((v) => String(v)));
  if (!allowed.has(selected)) {
    throw new MemberFilterValidationError('Invalid member filter.', 400);
  }

  return { selectedMemberPublicId: selected };
}

export function resolveBookingTargetMemberPublicIds(params: {
  selectionMode: unknown;
  selectedMemberPublicIds: unknown;
  availableMemberPublicIds: string[];
}) {
  const available = Array.from(new Set((params.availableMemberPublicIds || []).map((v) => String(v))));
  if (!available.length) {
    throw new MemberFilterValidationError('No team members available for booking.', 400);
  }

  const selectionMode = String(params.selectionMode || '').trim();
  if (selectionMode !== 'all' && selectionMode !== 'single') {
    throw new MemberFilterValidationError('Invalid booking selection mode.', 400);
  }

  const selected = Array.isArray(params.selectedMemberPublicIds)
    ? Array.from(new Set(params.selectedMemberPublicIds.map((v) => String(v).trim()).filter(Boolean)))
    : [];

  const availableSet = new Set(available);
  for (const value of selected) {
    if (!availableSet.has(value)) {
      throw new MemberFilterValidationError('Selected members are invalid.', 400);
    }
  }

  if (selectionMode === 'all') {
    return { selectionMode, targetMemberPublicIds: available };
  }

  if (selected.length !== 1) {
    throw new MemberFilterValidationError('Single-member booking requires exactly one selected member.', 400);
  }

  return { selectionMode, targetMemberPublicIds: selected };
}
