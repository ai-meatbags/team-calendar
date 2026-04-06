'use client';

import React from 'react';
import { AppProvider } from './app-context';
import { Header } from './header';
import { Toast } from './toast';

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <div className="backdrop" />
      <main className="shell">
        <Header />
        {children}
      </main>
      <Toast />
    </AppProvider>
  );
}
