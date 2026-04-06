'use client';

import React from 'react';
import { useApp } from './app-context';

export function Toast() {
  const { toast, clearToast } = useApp();
  if (!toast) {
    return null;
  }

  return (
    <div className="toast" role="status" onClick={clearToast}>
      {toast}
    </div>
  );
}
