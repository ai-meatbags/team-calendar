import * as React from 'react';
import { cn } from './utils';

type BadgeVariant = 'default' | 'success' | 'warning';

const badgeVariantClasses: Record<BadgeVariant, string> = {
  default: 'border-slate-900/10 bg-white/70 text-slate-700',
  success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-700'
};

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[11px]',
        badgeVariantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
