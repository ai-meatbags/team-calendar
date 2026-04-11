'use client';

import * as React from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { type ToggleProps, toggleStyles } from './toggle';
import { cn } from './utils';

const ToggleGroupContext = React.createContext<{
  variant?: ToggleProps['variant'];
  size?: ToggleProps['size'];
}>({
  size: 'default',
  variant: 'default'
});

export const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & {
    variant?: ToggleProps['variant'];
    size?: ToggleProps['size'];
  }
>(function ToggleGroup({ className, variant, size, children, ...props }, ref) {
  return (
    <ToggleGroupPrimitive.Root
      ref={ref}
      className={cn('inline-flex items-center justify-center gap-1', className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>{children}</ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
});

export const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> & {
    variant?: ToggleProps['variant'];
    size?: ToggleProps['size'];
  }
>(function ToggleGroupItem({ className, children, variant, size, ...props }, ref) {
  const context = React.useContext(ToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleStyles({
          variant: context.variant || variant,
          size: context.size || size,
          className
        })
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
});
