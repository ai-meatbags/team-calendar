'use client';

import React, { createContext, useContext } from 'react';
import { apiFetch } from './api-fetch';
import { useAuth, type CurrentUser } from './use-auth';
import { useToast } from './use-toast';

type AppContextValue = {
  apiFetch: typeof apiFetch;
  clearToast: () => void;
  currentUser: CurrentUser | null;
  isLoading: boolean;
  loadCurrentUser: () => Promise<CurrentUser | null>;
  logout: () => void;
  openAuthPopup: () => void;
  showToast: (message: string) => void;
  toast: string;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const toast = useToast();

  const value: AppContextValue = {
    apiFetch,
    ...auth,
    ...toast
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
