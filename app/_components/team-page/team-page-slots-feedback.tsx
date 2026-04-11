'use client';

import React from 'react';

type SlotsFeedbackProps = {
  variant: 'error' | 'empty';
  message: string;
};

export function SlotsFeedback({ variant, message }: SlotsFeedbackProps) {
  const isError = variant === 'error';

  return (
    <div className={`slots-feedback slots-feedback--${variant}`} role={isError ? 'alert' : 'status'}>
      <p className="slots-feedback__text">{message}</p>
    </div>
  );
}
