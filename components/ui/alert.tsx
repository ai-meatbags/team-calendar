'use client';

import * as React from 'react';
import { cn } from './utils';

type AlertVariant = 'default' | 'success' | 'destructive';

const alertVariantClasses: Record<AlertVariant, string> = {
  default: 'border-slate-900/10 bg-slate-900/[0.02] text-slate-700',
  success: 'border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-900',
  destructive: 'border-red-500/20 bg-red-500/[0.06] text-red-800'
};

export function Alert({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant }) {
  return (
    <div
      role="alert"
      className={cn('rounded-2xl border p-4', alertVariantClasses[variant], className)}
      {...props}
    />
  );
}

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h4 className={cn('text-sm font-semibold text-slate-900', className)} {...props} />;
}

export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-slate-600', className)} {...props} />;
}
