import { cn } from '@/utils/core';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as React from 'react';

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverClose = PopoverPrimitive.Close;
const PopoverPortal = PopoverPrimitive.Portal;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(
  (
    { className, sideOffset = 4, side = 'bottom', align = 'center', ...props },
    ref,
  ) => (
    <PopoverPortal>
      <PopoverPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        side={side}
        align={align}
        className={cn(
          'z-50 min-w-[8rem] max-w-[20rem] overflow-hidden rounded-md border bg-gray-800 p-2 text-gray-100 shadow-md',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          className,
        )}
        {...props}
      />
    </PopoverPortal>
  ),
);
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

const PopoverArrow = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Arrow>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Arrow>
>(({ className, ...props }, ref) => (
  <PopoverPrimitive.Arrow
    ref={ref}
    className={cn('fill-gray-800', className)}
    {...props}
  />
));
PopoverArrow.displayName = PopoverPrimitive.Arrow.displayName;

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverClose,
  PopoverPortal,
};
