'use client';

import { useCallback, useState } from 'react';
import type { TeamMember } from './team-page-types';
import { resolveTeamBookingSubmission, type ApiFetch } from './team-page-state';

type AvailabilitySlot = {
  start: string;
  end: string;
  members?: TeamMember[];
};

export function useTeamPageBooking({
  shareId,
  teamName,
  apiFetch,
  showToast,
  currentUser,
  selectionMode,
  selectedMembers
}: {
  shareId: string;
  teamName: string;
  apiFetch: ApiFetch;
  showToast: (message: string) => void;
  currentUser: { email?: string | null } | null;
  selectionMode: 'all' | 'single';
  selectedMembers: TeamMember[];
}) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [currentSlot, setCurrentSlot] = useState<AvailabilitySlot | null>(null);
  const [bookingState, setBookingState] = useState<'editing' | 'submitting' | 'success' | 'error'>('editing');
  const [formValues, setFormValues] = useState({ email: '', comment: '' });
  const isLoggedIn = Boolean(currentUser);

  const openSlot = useCallback((slot: AvailabilitySlot) => {
    setCurrentSlot(slot);
    setBookingOpen(true);
    setBookingState('editing');
    setFormValues({ email: '', comment: '' });
  }, []);

  const closeBooking = useCallback(() => {
    setBookingOpen(false);
    setCurrentSlot(null);
    setBookingState('editing');
    setFormValues({ email: '', comment: '' });
  }, []);

  const handleFieldChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormValues((previous) => ({
      ...previous,
      [name]: value
    }));
    setBookingState((previous) => (previous === 'error' ? 'editing' : previous));
  }, []);

  const handleBookingSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submission = resolveTeamBookingSubmission({
      shareId,
      teamName,
      currentSlot,
      currentUserEmail: currentUser?.email,
      formEmail: formValues.email,
      comment: formValues.comment,
      isLoggedIn,
      selectionMode,
      selectedMembers
    });

    if (!submission.ok) {
      showToast(submission.message);
      return;
    }

    setBookingState('submitting');
    try {
      await apiFetch('/api/booking', {
        method: 'POST',
        body: JSON.stringify(submission.payload)
      });
      setBookingState('success');
    } catch {
      setBookingState('error');
      showToast('Не удалось отправить запрос');
    }
  }, [
    apiFetch,
    currentSlot,
    currentUser?.email,
    formValues.comment,
    formValues.email,
    isLoggedIn,
    selectedMembers,
    selectionMode,
    shareId,
    showToast,
    teamName
  ]);

  return {
    bookingOpen,
    currentSlot,
    bookingState,
    isSubmitting: bookingState === 'submitting',
    isSuccess: bookingState === 'success',
    isLoggedIn,
    targetMembers: selectedMembers || [],
    selectionMode,
    teamName,
    formValues,
    openSlot,
    closeBooking,
    handleBookingSubmit,
    handleFieldChange
  };
}
