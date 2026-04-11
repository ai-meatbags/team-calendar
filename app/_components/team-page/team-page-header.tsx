'use client';

import React from 'react';
import Link from 'next/link';
import {
  canRenderJoinButton,
  getMemberDisplayName,
  getMemberStableKey
} from './team-page-members';
import type { TeamMember } from './team-page-types';

function ShareButton({ onShare }: { onShare: () => void }) {
  return (
    <button
      className="btn btn--primary btn--sm team-action-share transition-all duration-200 hover:shadow-glow focus-visible:ring-2 focus-visible:ring-accent/40"
      type="button"
      onClick={onShare}
    >
      Поделиться
    </button>
  );
}

function TeamMembersSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="team-members" aria-hidden="true">
      <div className="team-members__row">
        <div className="toggle team-duration-toggle--skeleton">
          <span className="team-toggle-segment--skeleton"><span className="skeleton-line skeleton-line--short" /></span>
          <span className="team-toggle-segment--skeleton"><span className="skeleton-line skeleton-line--short" /></span>
        </div>
        <div className="toggle team-member-toggle team-member-toggle--skeleton">
          {Array.from({ length: count + 1 }).map((_, index) => (
            <span className="team-toggle-segment--skeleton" key={index}>
              <span className="skeleton-avatar" />
              <span className="skeleton-line skeleton-line--short" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TeamMembers({
  members,
  selectedMemberPublicId,
  duration,
  onDurationChange,
  isDisabled,
  onSelectMember
}: {
  members: TeamMember[];
  selectedMemberPublicId: string | null;
  duration: number;
  onDurationChange: (duration: number) => void;
  isDisabled: boolean;
  onSelectMember?: (memberPublicId: string | null) => void;
}) {
  const isInteractive = typeof onSelectMember === 'function';
  const hasMembers = Array.isArray(members) && members.length > 0;
  const hasMultipleMembers = members.length > 1;

  return (
    <div className="team-members">
      <div className="team-members__row">
        <div className="team-member-controls">
          <div className={`toggle ${isDisabled ? 'is-disabled' : ''}`} role="group" aria-label="Длительность слота">
            <button type="button" className={duration === 60 ? 'is-active' : ''} onClick={() => onDurationChange(60)} disabled={isDisabled}>1 час</button>
            <button type="button" className={duration === 30 ? 'is-active' : ''} onClick={() => onDurationChange(30)} disabled={isDisabled}>30 мин</button>
          </div>
        </div>
        {(isInteractive || hasMembers) && (
          <div className={`toggle team-member-toggle ${isDisabled ? 'is-disabled' : ''}`} role="group" aria-label="Фильтр участников">
            {isInteractive && hasMultipleMembers ? (
              <button
                type="button"
                className={`team-member-toggle__button ${!selectedMemberPublicId ? 'is-active' : ''}`}
                onClick={() => onSelectMember?.(null)}
                disabled={isDisabled}
              >
                <span className={`member-team-icon ${!selectedMemberPublicId ? 'is-active' : ''}`} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M22 20v-1a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M15 4.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="member-name">Все участники</span>
              </button>
            ) : null}
            {(members || []).map((member, index) => {
              const key = getMemberStableKey(member, index);
              const isActive = hasMultipleMembers
                ? selectedMemberPublicId === member.memberPublicId
                : true;
              const avatar = member.picture ? (
                <img
                  className="member-avatar"
                  src={member.picture}
                  alt={`Аватар ${getMemberDisplayName(member)}`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="member-avatar member-avatar--empty" aria-hidden="true" />
              );

              return isInteractive && hasMultipleMembers ? (
                <button
                  className={`team-member-toggle__button ${isActive ? 'is-active' : ''}`}
                  key={key}
                  type="button"
                  onClick={() => onSelectMember(member.memberPublicId || null)}
                  disabled={isDisabled}
                >
                  {avatar}
                  <span className="member-name">{getMemberDisplayName(member)}</span>
                </button>
              ) : (
                <span className={`team-member-toggle__segment ${isActive ? 'is-active' : ''}`} key={key}>
                  {avatar}
                  <span className="member-name">{getMemberDisplayName(member)}</span>
                </span>
              );
            })}
          </div>
        )}
        {!isInteractive && !hasMembers ? <span className="empty-state">Пока никого нет.</span> : null}
      </div>
    </div>
  );
}

type TeamHeaderProps = {
  teamName: string;
  members: TeamMember[];
  isMembersLoading: boolean;
  isMember: boolean;
  hasUser: boolean;
  canJoin: boolean;
  selectedMemberPublicId: string | null;
  duration: number;
  onDurationChange: (duration: number) => void;
  isSwitchesDisabled: boolean;
  onMemberFilterChange: (memberPublicId: string | null) => void;
  onJoin: () => void;
  onShare: () => void;
  settingsHref: string;
  slotViewToggle?: React.ReactNode;
};

export function TeamHeaderActions({
  teamName,
  isMember,
  hasUser,
  canJoin,
  onJoin,
  onShare,
  settingsHref,
  slotViewToggle
}: Pick<
  TeamHeaderProps,
  'teamName' | 'isMember' | 'hasUser' | 'canJoin' | 'onJoin' | 'onShare' | 'settingsHref' | 'slotViewToggle'
>) {
  const showJoin = canRenderJoinButton({ hasUser, isMember, canJoin });

  return (
    <div className="team-header__main">
      <div className="team-title-row">
        <h1>{teamName}</h1>
        <div className="team-actions-inline">
          {slotViewToggle ? <div className="team-title-row__view-toggle">{slotViewToggle}</div> : null}
          {showJoin ? (
            <button className="btn btn--ghost transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent/40" type="button" onClick={onJoin}>
              Присоединиться
            </button>
          ) : null}
          {hasUser && isMember ? <ShareButton onShare={onShare} /> : null}
          {hasUser && isMember ? (
            <Link
              className="btn btn--ghost team-action-gear transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent/40"
              aria-label="Настройки команды"
              title="Настройки команды"
              href={settingsHref}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
              </svg>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function TeamHeaderControls({
  members,
  isMembersLoading,
  selectedMemberPublicId,
  duration,
  onDurationChange,
  isSwitchesDisabled,
  onMemberFilterChange
}: Pick<
  TeamHeaderProps,
  | 'members'
  | 'isMembersLoading'
  | 'selectedMemberPublicId'
  | 'duration'
  | 'onDurationChange'
  | 'isSwitchesDisabled'
  | 'onMemberFilterChange'
>) {
  return isMembersLoading ? (
    <TeamMembersSkeleton />
  ) : (
    <TeamMembers
      members={members}
      selectedMemberPublicId={selectedMemberPublicId}
      duration={duration}
      onDurationChange={onDurationChange}
      isDisabled={isSwitchesDisabled}
      onSelectMember={onMemberFilterChange}
    />
  );
}

export function TeamHeader(props: TeamHeaderProps) {
  return (
    <div className="team-header">
      <TeamHeaderActions {...props} />
      <TeamHeaderControls {...props} />
    </div>
  );
}
