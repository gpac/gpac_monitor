import * as React from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { cn } from '@/utils/core';

export const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn(
      'inline-flex gap-0.5 p-0.5 bg-monitor-panel rounded-md border border-white/5',
      className,
    )}
    {...props}
  />
));
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

export const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={cn(
      'px-2.5 py-1 text-xs rounded font-medium transition-colors',
      'text-gray-400 hover:text-gray-200 hover:bg-white/5',
      'data-[state=on]:bg-monitor-active-tab/25 data-[state=on]:text-white data-[state=on]:shadow-sm',
      className,
    )}
    {...props}
  />
));
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;
