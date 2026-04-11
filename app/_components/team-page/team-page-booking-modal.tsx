'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getMemberDisplayName, getMemberStableKey } from './team-page-members';
import { formatDate, formatTime } from './team-page-time';
import { useTeamPageBooking } from './team-page-booking-hooks';

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function TeamBookingModal({
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
          <div><h2>Бронирование</h2></div>
          <button className="modal__close" type="button" aria-label="Закрыть" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="booking-context">
          <div className="booking-context__item booking-context__item--members">
            <span>Участники</span>
            <div className="booking-context__members-list">
              {targetMembers.length > 0 ? targetMembers.map((member, index) => (
                <span className="booking-context__member" key={getMemberStableKey(member, index)}>
                  {member?.picture ? (
                    <img className="member-avatar" src={member.picture} alt={`Аватар ${getMemberDisplayName(member)}`} title={getMemberDisplayName(member)} loading="lazy" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="member-avatar member-avatar--empty" aria-hidden="true" />
                  )}
                  <strong className="booking-context__member-name">{getMemberDisplayName(member)}</strong>
                </span>
              )) : <strong>—</strong>}
            </div>
          </div>
          <div className="booking-context__item">
            <span>Дата</span>
            <strong>{slotStart && !Number.isNaN(slotStart.getTime()) ? formatDate(slotStart) : '—'}</strong>
          </div>
          <div className="booking-context__item">
            <span>Время</span>
            <strong>
              {slotStart && slotEnd && !Number.isNaN(slotStart.getTime()) && !Number.isNaN(slotEnd.getTime())
                ? `${formatTime(slotStart)} — ${formatTime(slotEnd)}`
                : '—'}
            </strong>
          </div>
        </div>
        {booking.isSuccess ? (
          <div className="status">Встреча запрошена, команда скоро создаст встречу в календаре.</div>
        ) : (
          <form className="form" onSubmit={(event) => void booking.handleBookingSubmit(event)}>
            {!booking.isLoggedIn ? (
              <label className="field">
                <span>Почта</span>
                <input className="w-full focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition" type="email" name="email" placeholder="name@example.com" required value={booking.formValues?.email || ''} onChange={booking.handleFieldChange} disabled={booking.isSubmitting} />
              </label>
            ) : null}
            <label className="field">
              <span>Комментарий</span>
              <textarea className="w-full focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition" name="comment" rows={3} value={booking.formValues?.comment || ''} onChange={booking.handleFieldChange} disabled={booking.isSubmitting} />
            </label>
            <button className="btn btn--primary transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent/40" type="submit" disabled={booking.isSubmitting}>
              {booking.isSubmitting ? 'Отправка...' : 'Отправить'}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
