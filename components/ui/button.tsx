import * as React from 'react';
import { cn } from './utils';

type ButtonVariant = 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'default' | 'sm';

const variantClasses: Record<ButtonVariant, string> = {
  default:
    'bg-[var(--accent)] text-white shadow-[0_12px_24px_rgba(239,108,56,0.3)] hover:bg-[#f07a4c]',
  outline: 'border border-slate-900/10 bg-white/80 text-slate-900 hover:bg-white',
  secondary: 'border border-slate-900/8 bg-slate-900/[0.03] text-slate-900 hover:bg-slate-900/[0.06]',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-900/[0.04]',
  destructive: 'border border-red-600/25 bg-red-600/10 text-red-700 hover:bg-red-600/15'
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-11 px-4 py-2 text-sm',
  sm: 'h-9 px-3 text-sm'
};

export function buttonStyles(params?: { variant?: ButtonVariant; size?: ButtonSize; className?: string }) {
  const variant = params?.variant || 'default';
  const size = params?.size || 'default';

  return cn(
    'inline-flex items-center justify-center rounded-full font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(239,108,56,0.35)] disabled:pointer-events-none disabled:opacity-60',
    variantClasses[variant],
    sizeClasses[size],
    params?.className
  );
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'default', size = 'default', type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
});
