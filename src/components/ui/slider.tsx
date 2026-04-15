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
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-white/10">
      <SliderPrimitive.Range className="absolute h-full bg-violet-600" />
    </SliderPrimitive.Track>
    {(props.value ?? props.defaultValue ?? [0]).map((_, index) => (
      <SliderPrimitive.Thumb
        key={index}
        className={cn(
          'block h-3.5 w-3.5 rounded-full border-2 border-[#111]',
          'bg-white shadow-[0_0_6px_2px_rgba(124,58,237,0.4)]',
          'transition-shadow focus-visible:outline-none',
          'hover:shadow-[0_0_8px_3px_rgba(124,58,237,0.6)]',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
      />
    ))}
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
