import * as React from 'react';
import { cn } from './utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = 'text', ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-11 w-full rounded-xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-[rgba(239,108,56,0.4)] focus:outline-none focus:ring-2 focus:ring-[rgba(239,108,56,0.2)] disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    />
  );
});
