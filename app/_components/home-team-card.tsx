'use client';

import React from 'react';
import Link from 'next/link';
import type { TeamSummary } from './header-model';

function formatHour(value: number) {
  return `${String(value).padStart(2, '0')}:00`;
}

function buildAvailabilityLabel(team: TeamSummary) {
  if (!team.myAvailability) {
    return null;
  }

  return `${formatHour(team.myAvailability.workdayStartHour)}-${formatHour(team.myAvailability.workdayEndHour)}`;
}

function buildInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export function HomeTeamCard({ team }: { team: TeamSummary }) {
  const visibleMembers = team.members.slice(0, 4);
  const hiddenMembersCount = Math.max(team.members.length - visibleMembers.length, 0);
  const availabilityLabel = buildAvailabilityLabel(team);

  return (
    <Link className="team-card team-card--rich" href={`/t/${team.shareId}`}>
      <div className="team-card__header">
        <h3>{team.name}</h3>
      </div>
      <div className="team-card__footer">
        <div className="team-card__avatars" aria-label={`Участники: ${team.members.length}`}>
          {visibleMembers.map((member, index) =>
            member.picture ? (
              <img
                key={`${member.name}-${index}`}
                className="team-card__avatar"
                src={member.picture}
                alt={`Аватар ${member.name}`}
                title={member.name}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span
                key={`${member.name}-${index}`}
                className="team-card__avatar team-card__avatar--fallback"
                aria-hidden="true"
                title={member.name}
              >
                {buildInitials(member.name)}
              </span>
            )
          )}
          {hiddenMembersCount > 0 ? (
            <span className="team-card__avatar team-card__avatar--count" aria-hidden="true">
              +{hiddenMembersCount}
            </span>
          ) : null}
        </div>
        {availabilityLabel ? (
          <div className="team-card__meta">
            <span className="team-card__meta-label">Мой интервал</span>
            <span className="team-card__meta-value">{availabilityLabel}</span>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
