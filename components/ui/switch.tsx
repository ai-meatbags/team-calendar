'use client';

import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from './utils';

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(function Switch({ className, ...props }, ref) {
  return (
    <SwitchPrimitives.Root
      ref={ref}
      className={cn(
        'peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-slate-900/12 bg-slate-300/90 p-0.5 shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(239,108,56,0.35)] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[var(--accent)] data-[state=checked]:bg-[var(--accent)] data-[state=unchecked]:bg-slate-300/90',
        className
      )}
      {...props}
    >
      <SwitchPrimitives.Thumb className="pointer-events-none block size-5 rounded-full border border-slate-900/8 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.18)] transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
    </SwitchPrimitives.Root>
  );
});

Switch.displayName = SwitchPrimitives.Root.displayName;
