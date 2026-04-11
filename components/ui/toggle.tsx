'use client';

import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cn } from './utils';

type ToggleVariant = 'default' | 'outline';
type ToggleSize = 'default' | 'sm' | 'lg';

const variantClasses: Record<ToggleVariant, string> = {
  default:
    'border border-transparent bg-transparent text-slate-700 hover:bg-slate-900/[0.04] hover:text-slate-900 data-[state=on]:bg-white data-[state=on]:text-slate-900',
  outline:
    'border border-slate-900/10 bg-white/80 text-slate-700 hover:bg-white data-[state=on]:border-slate-900/12 data-[state=on]:bg-white data-[state=on]:text-slate-900'
};

const sizeClasses: Record<ToggleSize, string> = {
  default: 'h-10 min-w-10 px-3',
  sm: 'h-9 min-w-9 px-2.5',
  lg: 'h-11 min-w-11 px-4'
};

export function toggleStyles(params?: {
  variant?: ToggleVariant;
  size?: ToggleSize;
  className?: string;
}) {
  const variant = params?.variant || 'default';
  const size = params?.size || 'default';

  return cn(
    'inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    variantClasses[variant],
    sizeClasses[size],
    params?.className
  );
}

export type ToggleProps = React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & {
  variant?: ToggleVariant;
  size?: ToggleSize;
};

export const Toggle = React.forwardRef<React.ElementRef<typeof TogglePrimitive.Root>, ToggleProps>(
  function Toggle({ className, variant = 'default', size = 'default', ...props }, ref) {
    return (
      <TogglePrimitive.Root
        ref={ref}
        className={cn(toggleStyles({ variant, size, className }))}
        {...props}
      />
    );
  }
);
