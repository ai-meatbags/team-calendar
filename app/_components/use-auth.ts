'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from './api-fetch';
import { buildAuthPopupUrl, buildLogoutUrl, shouldAcceptAuthMessage } from './auth-state';

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  picture: string | null;
};

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const popupWindowRef = useRef<Window | null>(null);

  const loadCurrentUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const me = (await apiFetch('/api/me')) as CurrentUser;
      setCurrentUser(me);
      return me;
    } catch {
      setCurrentUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const closeAuthPopup = useCallback(() => {
    const popup = popupWindowRef.current;
    popupWindowRef.current = null;

    if (!popup) {
      return;
    }

    try {
      popup.close();
    } catch {
      // intentionally ignored: popup may already be gone or browser may block close
    }
  }, []);

  const handleAuthSuccess = useCallback(() => {
    closeAuthPopup();
    void loadCurrentUser();
  }, [closeAuthPopup, loadCurrentUser]);

  const openAuthPopup = useCallback(() => {
    const popup = window.open(
      buildAuthPopupUrl(window.location.pathname, window.location.search),
      'google-auth',
      'width=520,height=640,menubar=no,location=no,resizable=yes,scrollbars=yes,status=no'
    );

    if (!popup) {
      window.location.href = `/auth/google?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }

    popupWindowRef.current = popup;
  }, []);

  const logout = useCallback(() => {
    window.location.href = buildLogoutUrl(window.location.pathname, window.location.search);
  }, []);

  useEffect(() => {
    void loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    function handleMessage(event: MessageEvent<{ type?: string }>) {
      if (!shouldAcceptAuthMessage({
        eventOrigin: event.origin,
        windowOrigin: window.location.origin,
        windowHostname: window.location.hostname
      })) {
        return;
      }

      if (event.data?.type === 'auth:success') {
        handleAuthSuccess();
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== 'team-calendar-auth-success' || !event.newValue) {
        return;
      }

      handleAuthSuccess();
    }

    const channel =
      typeof BroadcastChannel !== 'undefined'
        ? new BroadcastChannel('team-calendar-auth')
        : null;

    function handleChannelMessage(event: MessageEvent<{ type?: string }>) {
      if (event.data?.type === 'auth:success') {
        handleAuthSuccess();
      }
    }

    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorage);
    channel?.addEventListener('message', handleChannelMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
      channel?.removeEventListener('message', handleChannelMessage);
      channel?.close();
    };
  }, [handleAuthSuccess]);

  useEffect(() => {
    return () => {
      popupWindowRef.current = null;
    };
  }, []);

  return {
    currentUser,
    isLoading,
    loadCurrentUser,
    openAuthPopup,
    logout
  };
}
