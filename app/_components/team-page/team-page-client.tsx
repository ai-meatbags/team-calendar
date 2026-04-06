'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useApp } from '../app-context';
import {
  buildTeamPageShareToastMessage,
  canRenderJoinButton,
  formatCount,
  formatDate,
  formatHour,
  formatTime,
  getDateKey,
  getMemberDisplayName,
  getMemberStableKey,
  type CalendarSelectionItem,
  type TeamMember
} from './team-page-utils';
import {
  useDurationFilter,
  useMemberFilter,
  useTeamPageActions,
  useTeamPageAvailability,
  useTeamPageBooking,
  useTeamPageCore,
  useTeamPageSettings
} from './team-page-hooks';

type TeamPageClientProps = {
  shareId: string;
};

type SlotsViewProps = {
  slots: Array<{ start: string; end: string; members?: TeamMember[] }>;
  isLoading: boolean;
  slotsStatus: string;
  onDismissStatus: () => void;
  onRefresh: () => void;
  settingsSummary: {
    days?: number;
    workdayStartHour?: number;
    workdayEndHour?: number;
    minNoticeHours?: number;
    timeMin?: string;
    timeMax?: string;
  };
  onSlotClick: (slot: { start: string; end: string; members?: TeamMember[] }) => void;
};

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

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
          <span className="team-toggle-segment--skeleton">
            <span className="skeleton-line skeleton-line--short" />
          </span>
          <span className="team-toggle-segment--skeleton">
            <span className="skeleton-line skeleton-line--short" />
          </span>
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

  const renderMemberSegment = (member: TeamMember, index: number) => {
    const key = getMemberStableKey(member, index);
    const isActive = selectedMemberPublicId === member.memberPublicId;

    if (!isInteractive) {
      return (
        <span className={`team-member-toggle__segment ${isActive ? 'is-active' : ''}`} key={key}>
          {member.picture ? (
            <img
              className="member-avatar"
              src={member.picture}
              alt={`Аватар ${getMemberDisplayName(member)}`}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="member-avatar member-avatar--empty" aria-hidden="true" />
          )}
          <span className="member-name">{getMemberDisplayName(member)}</span>
        </span>
      );
    }

    return (
      <button
        className={`team-member-toggle__button ${isActive ? 'is-active' : ''}`}
        key={key}
        type="button"
        onClick={() => onSelectMember(member.memberPublicId || null)}
        disabled={isDisabled}
      >
        {member.picture ? (
          <img
            className="member-avatar"
            src={member.picture}
            alt={`Аватар ${getMemberDisplayName(member)}`}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="member-avatar member-avatar--empty" aria-hidden="true" />
        )}
        <span className="member-name">{getMemberDisplayName(member)}</span>
      </button>
    );
  };

  return (
    <div className="team-members">
      <div className="team-members__row">
        <div className="team-member-controls">
          <div
            className={`toggle ${isDisabled ? 'is-disabled' : ''}`}
            role="group"
            aria-label="Длительность слота"
          >
            <button
              type="button"
              className={duration === 60 ? 'is-active' : ''}
              onClick={() => onDurationChange(60)}
              disabled={isDisabled}
            >
              1 час
            </button>
            <button
              type="button"
              className={duration === 30 ? 'is-active' : ''}
              onClick={() => onDurationChange(30)}
              disabled={isDisabled}
            >
              30 мин
            </button>
          </div>
        </div>
        {(isInteractive || hasMembers) && (
          <div
            className={`toggle team-member-toggle ${isDisabled ? 'is-disabled' : ''}`}
            role="group"
            aria-label="Фильтр участников"
          >
            {isInteractive && (
              <button
                type="button"
                className={`team-member-toggle__button ${!selectedMemberPublicId ? 'is-active' : ''}`}
                onClick={() => onSelectMember?.(null)}
                disabled={isDisabled}
              >
                <span className={`member-team-icon ${!selectedMemberPublicId ? 'is-active' : ''}`} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.8" />
                    <path
                      d="M22 20v-1a4 4 0 0 0-3-3.87"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15 4.13a4 4 0 0 1 0 7.75"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="member-name">Все участники</span>
              </button>
            )}
            {(members || []).map((member, index) => renderMemberSegment(member, index))}
          </div>
        )}
        {!isInteractive && !hasMembers && <span className="empty-state">Пока никого нет.</span>}
      </div>
    </div>
  );
}

export function TeamHeader({
  teamName,
  members,
  isMembersLoading,
  isMember,
  hasUser,
  canJoin,
  selectedMemberPublicId,
  duration,
  onDurationChange,
  isSwitchesDisabled,
  onMemberFilterChange,
  onJoin,
  onShare,
  onOpenSettings
}: {
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
  onOpenSettings: () => void;
}) {
  const showJoin = canRenderJoinButton({ hasUser, isMember, canJoin });

  return (
    <div className="team-header">
      <div className="team-header__main">
        <div className="team-title-row">
          <h1>{teamName}</h1>
          <div className="team-actions-inline">
            {showJoin && (
              <button
                className="btn btn--ghost transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent/40"
                type="button"
                onClick={onJoin}
              >
                Присоединиться
              </button>
            )}
            {hasUser && isMember && <ShareButton onShare={onShare} />}
            {hasUser && isMember && (
              <button
                className="btn btn--ghost team-action-gear transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent/40"
                type="button"
                aria-label="Настройки команды"
                title="Настройки команды"
                onClick={onOpenSettings}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  width="18"
                  height="18"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                </svg>
              </button>
            )}
          </div>
        </div>
        {isMembersLoading ? (
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
        )}
      </div>
    </div>
  );
}

function SlotCard({
  slot,
  onClick
}: {
  slot: { start: Date; end: Date; members?: TeamMember[] };
  onClick: (slot: { start: string; end: string; members?: TeamMember[] }) => void;
}) {
  return (
    <button className="slot-card" type="button" onClick={() => onClick({
      start: slot.start.toISOString(),
      end: slot.end.toISOString(),
      members: slot.members || []
    })}>
      <strong>
        {formatTime(slot.start)}
        <span className="slot-icon" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        </span>
      </strong>
      <div className="slot-people">
        {slot.members?.length ? (
          slot.members.map((member, index) =>
            member.picture ? (
              <img
                className="slot-avatar"
                src={member.picture}
                key={getMemberStableKey(member, index)}
                alt={`Аватар ${getMemberDisplayName(member)}`}
                title={getMemberDisplayName(member)}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span
                className="slot-avatar slot-avatar--empty"
                key={getMemberStableKey(member, index)}
                title={getMemberDisplayName(member)}
                aria-hidden="true"
              />
            )
          )
        ) : (
          <div className="slot-people slot-people--empty">—</div>
        )}
      </div>
    </button>
  );
}

function DaySlots({
  label,
  slots,
  onSlotClick
}: {
  label: string;
  slots: Array<{ start: Date; end: Date; members?: TeamMember[] }>;
  onSlotClick: (slot: { start: string; end: string; members?: TeamMember[] }) => void;
}) {
  return (
    <div className="day-group">
      <div className="day-group__title">{label}</div>
      <div className="slot-grid">
        {slots.map((slot) => (
          <SlotCard key={slot.start.toISOString()} slot={slot} onClick={onSlotClick} />
        ))}
      </div>
    </div>
  );
}

function SlotsSkeleton() {
  return (
    <div>
      {Array.from({ length: 3 }, (_, index) => (
        <div className="day-group" key={`skeleton-day-${index}`}>
          <div className="day-group__title">
            <span className="skeleton-line skeleton-line--medium" />
          </div>
          <div className="slot-grid">
            {Array.from({ length: 5 }, (__, cardIndex) => (
              <div className="slot-card slot-card--skeleton" key={`skeleton-card-${index}-${cardIndex}`}>
                <div className="skeleton-row">
                  <div className="skeleton-line skeleton-line--wide" />
                  <span className="slot-icon slot-icon--skeleton" aria-hidden="true" />
                </div>
                <div className="slot-people">
                  <span className="skeleton-avatar" />
                  <span className="skeleton-avatar" />
                  <span className="skeleton-avatar" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SlotsView({
  slots,
  isLoading,
  slotsStatus,
  onDismissStatus,
  onRefresh,
  settingsSummary,
  onSlotClick
}: SlotsViewProps) {
  const groupedSlots = useMemo(() => {
    const groups = new Map<string, { label: string; slots: Array<{ start: Date; end: Date; members?: TeamMember[] }> }>();
    slots.forEach((slot) => {
      const start = new Date(slot.start);
      const key = getDateKey(start);
      if (!groups.has(key)) {
        groups.set(key, { label: formatDate(start), slots: [] });
      }
      groups.get(key)?.slots.push({
        start,
        end: new Date(slot.end),
        members: slot.members || []
      });
    });
    return Array.from(groups.values());
  }, [slots]);

  const windowLabel = useMemo(() => {
    if (!settingsSummary) {
      return '—';
    }
    const rangeStart = settingsSummary.timeMin ? new Date(settingsSummary.timeMin) : null;
    const rangeEnd = settingsSummary.timeMax ? new Date(settingsSummary.timeMax) : null;
    const days =
      typeof settingsSummary.days === 'number' && Number.isFinite(settingsSummary.days)
        ? settingsSummary.days
        : rangeStart && rangeEnd
          ? Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (24 * 60 * 60 * 1000))
          : null;
    if (!days) {
      return '—';
    }
    return `${formatCount(days, ['день', 'дня', 'дней'])} вперед`;
  }, [settingsSummary]);

  const hoursLabel = useMemo(() => {
    if (!settingsSummary) {
      return '—';
    }
    if (
      typeof settingsSummary.workdayStartHour === 'number' &&
      typeof settingsSummary.workdayEndHour === 'number'
    ) {
      return `${formatHour(settingsSummary.workdayStartHour)}—${formatHour(
        settingsSummary.workdayEndHour
      )} МСК`;
    }
    return '—';
  }, [settingsSummary]);

  const minLabel = useMemo(() => {
    if (!settingsSummary) {
      return '—';
    }
    if (typeof settingsSummary.minNoticeHours === 'number') {
      return formatCount(settingsSummary.minNoticeHours, ['час', 'часа', 'часов']);
    }
    return '—';
  }, [settingsSummary]);

  return (
    <div className="card card--slots">
      <div className="card__header">
        <div className="slot-header">
          <div className="slot-title-row">
            <h1>Выбери слот</h1>
          </div>
          <div className="slot-meta slot-meta--single-row">
            <span className="rules-label rules-label--inline">Правила показа:</span>
            <span className="rule-item">
              Окно <span>{windowLabel}</span>
            </span>
            <span className="rule-item">
              <span>{hoursLabel}</span>
            </span>
            <span className="rule-item">
              бронь минимум за <span>{minLabel}</span>
            </span>
          </div>
        </div>
        <div className="slot-controls slot-controls--hidden" aria-hidden="true">
          <button
            className={`slot-controls__refresh ${isLoading ? 'is-loading' : ''}`}
            type="button"
            onClick={onRefresh}
            aria-label="Обновить слоты"
            title="Обновить слоты"
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 5a7 7 0 0 1 6.1 3.6h-2.2l2.9 3.9 2.9-3.9h-2.2A9.5 9.5 0 0 0 3.9 8.6l2 1.2A7 7 0 0 1 12 5zm-8.7 6.5A9.5 9.5 0 0 0 20.1 15.4l-2-1.2A7 7 0 0 1 5.9 15.4h2.2l-2.9-3.9-2.9 3.9h2.2z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>

      {slotsStatus ? (
        <div className="slots-alert" role="alert">
          <span>{slotsStatus}</span>
          <button
            className="slots-alert__close"
            type="button"
            aria-label="Скрыть уведомление об ошибке"
            onClick={onDismissStatus}
          >
            &times;
          </button>
        </div>
      ) : null}

      <div className="slots">
        {isLoading ? (
          <SlotsSkeleton />
        ) : groupedSlots.length ? (
          groupedSlots.map((group) => (
            <DaySlots key={group.label} label={group.label} slots={group.slots} onSlotClick={onSlotClick} />
          ))
        ) : (
          <div className="empty-state">Свободных слотов не найдено.</div>
        )}
      </div>
    </div>
  );
}

function CalendarSelection({
  selection,
  onChange,
  disabled
}: {
  selection: Record<string, CalendarSelectionItem>;
  onChange: (id: string, value: CalendarSelectionItem) => void;
  disabled: boolean;
}) {
  const items = Object.values(selection || {});
  if (!items.length) {
    return <p className="panel__meta">Календари не найдены.</p>;
  }

  return (
    <div className="calendar-selection">
      {items.map((item) => (
        <label className="calendar-selection__item" key={item.id}>
          <input
            className="calendar-checkbox__input"
            type="checkbox"
            checked={Boolean(item.active)}
            disabled={disabled}
            onChange={(event) =>
              onChange(String(item.id || ''), {
                ...item,
                active: event.target.checked
              })
            }
          />
          <span className="calendar-checkbox__box" aria-hidden="true" />
          <span className="calendar-selection__title">{item.title || item.summary || item.id}</span>
        </label>
      ))}
    </div>
  );
}

function CalendarSelectionSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="calendar-selection calendar-selection--skeleton" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="calendar-selection__item calendar-selection__item--skeleton" key={index}>
          <span className="calendar-checkbox__box calendar-checkbox__box--skeleton" />
          <span className="skeleton-line skeleton-line--medium" />
        </div>
      ))}
    </div>
  );
}

function TeamSettingsModal({
  isOpen,
  onClose,
  teamSettings,
  teamName,
  onDelete
}: {
  isOpen: boolean;
  onClose: () => void;
  teamSettings: ReturnType<typeof useTeamPageSettings>;
  teamName: string;
  onDelete: () => void;
}) {
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') {
      return undefined;
    }
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="modal" onClick={onClose}>
      <div className="modal__card" onClick={(event) => event.stopPropagation()}>
        <div className="modal__header">
          <div>
            <h2>Настройки команды</h2>
          </div>
          <button className="modal__close" type="button" aria-label="Закрыть" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <form className="form" onSubmit={(event) => void teamSettings.handleTeamSettingsSubmit(event)}>
          <label className="field">
            <span>Имя команды</span>
            <input
              className="w-full focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition"
              type="text"
              value={teamSettings.teamNameDraft ?? teamName ?? ''}
              onChange={(event) => teamSettings.setTeamNameDraft(event.target.value)}
              disabled={!teamSettings.canEditName}
            />
          </label>
          <div className="field">
            <span>Кто может присоединиться к команде</span>
            <div
              className="toggle team-member-toggle team-settings-privacy-toggle"
              role="group"
              aria-label="Кто может присоединиться к команде"
            >
              <button
                type="button"
                className={`team-member-toggle__button ${teamSettings.privacyDraft === 'public' ? 'is-active' : ''}`}
                onClick={() => teamSettings.setPrivacyDraft('public')}
                disabled={!teamSettings.canEditPrivacy || teamSettings.teamSettingsSaving}
              >
                Все могут
              </button>
              <button
                type="button"
                className={`team-member-toggle__button ${teamSettings.privacyDraft === 'private' ? 'is-active' : ''}`}
                onClick={() => teamSettings.setPrivacyDraft('private')}
                disabled={!teamSettings.canEditPrivacy || teamSettings.teamSettingsSaving}
              >
                Никто не может
              </button>
            </div>
          </div>
          <p className="panel__meta modal__meta">Выбери календари для расчета слотов</p>
          {teamSettings.teamSettingsLoading ? (
            <CalendarSelectionSkeleton />
          ) : (
            <CalendarSelection
              selection={teamSettings.calendarSelection}
              onChange={teamSettings.handleSelectionChange}
              disabled={teamSettings.teamSettingsSaving}
            />
          )}
          {teamSettings.canDelete ? (
            <div className="field">
              <span>Интеграции и вебхуки</span>
              <p className="panel__meta modal__meta">
                Новые заявки на бронирование отправляются во все активные вебхуки команды
              </p>
              {teamSettings.teamSettingsLoading ? (
                <CalendarSelectionSkeleton rows={2} />
              ) : (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition"
                      type="url"
                      inputMode="url"
                      placeholder="https://hooks.example.com/booking"
                      value={teamSettings.newWebhookUrl}
                      onChange={(event) => teamSettings.setNewWebhookUrl(event.target.value)}
                      disabled={teamSettings.webhooksBusy}
                    />
                    <button
                      className="btn btn--primary shrink-0"
                      type="button"
                      onClick={() => void teamSettings.handleWebhookAdd()}
                      disabled={teamSettings.webhooksBusy}
                    >
                      Добавить
                    </button>
                  </div>
                  {teamSettings.webhooks.length ? (
                    <div className="space-y-3">
                      {teamSettings.webhooks.map((webhook) => (
                        <div
                          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                          key={webhook.id || webhook.targetUrl}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <label className="flex min-w-0 flex-1 items-start gap-3">
                              <input
                                type="checkbox"
                                checked={Boolean(webhook.isActive)}
                                onChange={(event) =>
                                  void teamSettings.handleWebhookToggle(String(webhook.id || ''), event.target.checked)
                                }
                                disabled={teamSettings.webhooksBusy}
                              />
                              <span className="min-w-0">
                                <span className="block break-all font-medium text-white/95">
                                  {webhook.targetUrl || '—'}
                                </span>
                                <span className="mt-1 block text-sm text-white/60">
                                  {teamSettings.formatTeamWebhookStateLabel(webhook)} ·{' '}
                                  {teamSettings.formatTeamWebhookDeliveryLabel(webhook)}
                                </span>
                                {webhook.lastError ? (
                                  <span className="mt-1 block text-sm text-amber-200/80">{webhook.lastError}</span>
                                ) : null}
                              </span>
                            </label>
                            <button
                              className="btn btn--ghost shrink-0"
                              type="button"
                              onClick={() => void teamSettings.handleWebhookDelete(String(webhook.id || ''))}
                              disabled={teamSettings.webhooksBusy}
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="panel__meta">Пока вебхуков нет</p>
                  )}
                </div>
              )}
            </div>
          ) : null}
          {!teamSettings.teamSettingsLoading && teamSettings.teamSettingsStatus && (
            <div className="status">{teamSettings.teamSettingsStatus}</div>
          )}
          {!teamSettings.teamSettingsLoading && teamSettings.webhookActionStatus && (
            <div className="status">{teamSettings.webhookActionStatus}</div>
          )}
          <button
            className="btn btn--primary transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent/40"
            type="submit"
            disabled={teamSettings.teamSettingsSaving || teamSettings.webhooksBusy}
          >
            Сохранить
          </button>
        </form>
        {teamSettings.canDelete && (
          <div className="danger-zone mt-6">
            <h4>Опасная зона</h4>
            <p className="panel__meta">Удаление команды удалит всех участников. Действие необратимо.</p>
            <button className="btn btn--danger" type="button" onClick={onDelete}>
              Удалить команду
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function TeamBookingModal({
  booking,
  onClose
}: {
  booking: ReturnType<typeof useTeamPageBooking>;
  onClose: () => void;
}) {
  const isOpen = Boolean(booking.bookingOpen);
  const targetMembers = Array.isArray(booking.targetMembers) ? booking.targetMembers : [];
  const slotStart = booking.currentSlot?.start ? new Date(booking.currentSlot.start) : null;
  const slotEnd = booking.currentSlot?.end ? new Date(booking.currentSlot.end) : null;
  const slotDateLabel =
    slotStart && !Number.isNaN(slotStart.getTime()) ? formatDate(slotStart) : '—';
  const slotTimeLabel =
    slotStart && slotEnd && !Number.isNaN(slotStart.getTime()) && !Number.isNaN(slotEnd.getTime())
      ? `${formatTime(slotStart)} — ${formatTime(slotEnd)}`
      : '—';

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') {
      return undefined;
    }
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="modal" onClick={onClose}>
      <div className="modal__card" onClick={(event) => event.stopPropagation()}>
        <div className="modal__header">
          <div>
            <h2>Бронирование</h2>
          </div>
          <button className="modal__close" type="button" aria-label="Закрыть" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="booking-context">
          <div className="booking-context__item booking-context__item--members">
            <span>Участники</span>
            <div className="booking-context__members-list">
              {targetMembers.length > 0 ? (
                targetMembers.map((member, index) => (
                  <span className="booking-context__member" key={getMemberStableKey(member, index)}>
                    {member?.picture ? (
                      <img
                        className="member-avatar"
                        src={member.picture}
                        alt={`Аватар ${getMemberDisplayName(member)}`}
                        title={getMemberDisplayName(member)}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="member-avatar member-avatar--empty" aria-hidden="true" />
                    )}
                    <strong className="booking-context__member-name">{getMemberDisplayName(member)}</strong>
                  </span>
                ))
              ) : (
                <strong>—</strong>
              )}
            </div>
          </div>
          <div className="booking-context__item">
            <span>Дата</span>
            <strong>{slotDateLabel}</strong>
          </div>
          <div className="booking-context__item">
            <span>Время</span>
            <strong>{slotTimeLabel}</strong>
          </div>
        </div>
        {booking.isSuccess ? (
          <div className="status">Встреча запрошена, команда скоро создаст встречу в календаре.</div>
        ) : (
          <form className="form" onSubmit={(event) => void booking.handleBookingSubmit(event)}>
            {!booking.isLoggedIn ? (
              <label className="field">
                <span>Почта</span>
                <input
                  className="w-full focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition"
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  required
                  value={booking.formValues?.email || ''}
                  onChange={booking.handleFieldChange}
                  disabled={booking.isSubmitting}
                />
              </label>
            ) : null}
            <label className="field">
              <span>Комментарий</span>
              <textarea
                className="w-full focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition"
                name="comment"
                rows={3}
                value={booking.formValues?.comment || ''}
                onChange={booking.handleFieldChange}
                disabled={booking.isSubmitting}
              />
            </label>
            <button
              className="btn btn--primary transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent/40"
              type="submit"
              disabled={booking.isSubmitting}
            >
              {booking.isSubmitting ? 'Отправка...' : 'Отправить'}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

export function NotFoundPanel() {
  return (
    <section className="panel team-panel">
      <h2>Команда не найдена</h2>
      <p className="panel__meta">
        Вернуться к <Link href="/">списку команд</Link>.
      </p>
    </section>
  );
}

export default function TeamPageClient({ shareId }: TeamPageClientProps) {
  const router = useRouter();
  const { apiFetch, showToast, openAuthPopup, currentUser } = useApp();
  const hasUser = Boolean(currentUser);

  const teamCore = useTeamPageCore({
    shareId,
    apiFetch
  });
  const members = teamCore.teamData?.members || [];
  const isMember = Boolean(teamCore.teamData?.isMember);
  const isMembersLoading = !teamCore.teamData;
  const durationFilter = useDurationFilter();
  const memberFilter = useMemberFilter({
    members,
    isEnabled: Boolean(teamCore.teamData)
  });
  const selectedMemberPublicId = memberFilter.selectedMemberPublicId;

  const targetMembers = useMemo(() => {
    if (!members.length) {
      return [];
    }
    if (selectedMemberPublicId) {
      return members.filter((member) => member.memberPublicId === selectedMemberPublicId);
    }
    return members;
  }, [members, selectedMemberPublicId]);
  const selectionMode = selectedMemberPublicId ? 'single' : 'all';
  const selectedMemberName = useMemo(() => {
    if (!selectedMemberPublicId) {
      return '';
    }
    const selectedMember = members.find(
      (member) => member.memberPublicId === selectedMemberPublicId
    );
    return selectedMember ? getMemberDisplayName(selectedMember) : '';
  }, [members, selectedMemberPublicId]);
  const shareToastMessage = buildTeamPageShareToastMessage(
    selectedMemberName,
    durationFilter.duration
  );

  const availability = useTeamPageAvailability({
    shareId,
    apiFetch,
    isEnabled: Boolean(teamCore.teamData),
    selectedMemberPublicId,
    duration: durationFilter.duration
  });
  const teamSettings = useTeamPageSettings({
    shareId,
    apiFetch,
    showToast,
    onTeamNameUpdated: teamCore.applyTeamName,
    onSettingsSaved: availability.refreshAvailability
  });
  const booking = useTeamPageBooking({
    shareId,
    teamName: teamCore.teamName,
    apiFetch,
    showToast,
    currentUser,
    selectionMode,
    selectedMembers: targetMembers
  });
  const actions = useTeamPageActions({
    shareId,
    hasUser,
    openAuthPopup,
    apiFetch,
    showToast,
    shareToastMessage,
    refresh: teamCore.refresh,
    navigateHome: () => router.push('/')
  });

  const isSwitchesDisabled = availability.isSlotsLoading || isMembersLoading;

  if (teamCore.notFound) {
    return <NotFoundPanel />;
  }

  const openTeamSettings = () => {
    if (!hasUser || !isMember) {
      return;
    }
    teamSettings.setTeamNameDraft(teamCore.teamName || '');
    teamSettings.setTeamSettingsOpen(true);
  };

  return (
    <>
      <TeamHeader
        teamName={teamCore.teamName}
        members={members}
        isMembersLoading={isMembersLoading}
        isMember={isMember}
        hasUser={hasUser}
        canJoin={Boolean(teamCore.teamData?.canJoin)}
        selectedMemberPublicId={selectedMemberPublicId}
        duration={durationFilter.duration}
        onDurationChange={durationFilter.setDuration}
        isSwitchesDisabled={isSwitchesDisabled}
        onMemberFilterChange={memberFilter.setMemberFilter}
        onJoin={actions.handleJoin}
        onShare={actions.handleShare}
        onOpenSettings={openTeamSettings}
      />

      <div className="team-grid">
        <SlotsView
          slots={availability.slots}
          isLoading={availability.isSlotsLoading}
          slotsStatus={availability.slotsStatus}
          onDismissStatus={() => availability.setSlotsStatus('')}
          onRefresh={() => {
            void availability.refreshAvailability();
          }}
          settingsSummary={availability.settingsSummary}
          onSlotClick={booking.openSlot}
        />
      </div>

      <TeamSettingsModal
        isOpen={teamSettings.teamSettingsOpen}
        onClose={() => teamSettings.setTeamSettingsOpen(false)}
        teamSettings={teamSettings}
        teamName={teamCore.teamName}
        onDelete={actions.handleDelete}
      />

      <TeamBookingModal booking={booking} onClose={booking.closeBooking} />
    </>
  );
}
