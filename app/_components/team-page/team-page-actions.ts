'use client';

import { useCallback } from 'react';
import {
  executeTeamDeleteAction,
  executeTeamJoinAction,
  executeTeamShareAction,
  TEAM_DELETE_CONFIRMATION_MESSAGE,
  type ApiFetch
} from './team-page-state';

export function useTeamPageActions({
  shareId,
  hasUser,
  openAuthPopup,
  apiFetch,
  showToast,
  shareToastMessage,
  refresh,
  navigateHome
}: {
  shareId: string;
  hasUser: boolean;
  openAuthPopup: () => void;
  apiFetch: ApiFetch;
  showToast: (message: string) => void;
  shareToastMessage: string;
  refresh: () => Promise<void>;
  navigateHome: () => void;
}) {
  const handleJoin = useCallback(async () => {
    await executeTeamJoinAction({
      shareId,
      hasUser,
      openAuthPopup,
      apiFetch,
      refresh,
      showToast
    });
  }, [apiFetch, hasUser, openAuthPopup, refresh, shareId, showToast]);

  const handleDelete = useCallback(async () => {
    await executeTeamDeleteAction({
      shareId,
      confirmDelete: () => window.confirm(TEAM_DELETE_CONFIRMATION_MESSAGE),
      apiFetch,
      navigateHome,
      showToast
    });
  }, [apiFetch, navigateHome, shareId, showToast]);

  const handleShare = useCallback(async () => {
    await executeTeamShareAction({
      locationHref: window.location.href,
      writeClipboardText: (value) => navigator.clipboard.writeText(value),
      showToast,
      shareToastMessage
    });
  }, [shareToastMessage, showToast]);

  return {
    handleJoin,
    handleDelete,
    handleShare
  };
}
