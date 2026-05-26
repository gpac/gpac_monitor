import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/utils/core';
import { forwardRef, ElementRef, ComponentPropsWithoutRef } from 'react';

const Slider = forwardRef<
  ElementRef<typeof SliderPrimitive.Root>,
  ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex w-full touch-none select-none items-center',
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-gray-750">
      <SliderPrimitive.Range className="absolute h-full bg-violet-600" />
    </SliderPrimitive.Track>
    {(props.value ?? props.defaultValue ?? [0]).map((_: number, index: number) => (
      <SliderPrimitive.Thumb
        key={index}
        className={cn(
          'block h-3.5 w-3.5 rounded-full border border-violet-400/50',
          'bg-white shadow-[0_1px_4px_rgba(0,0,0,0.4)]',
          'transition-shadow focus-visible:outline-none',
          'hover:shadow-[0_0_0_3px_rgba(139,92,246,0.2)]',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
      />
    ))}
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
