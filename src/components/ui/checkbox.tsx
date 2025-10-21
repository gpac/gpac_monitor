import { cn } from '../../utils/cn';
import * as CheckboxPrimitives from '@radix-ui/react-checkbox';
import * as React from 'react';
import { FiCheck } from 'react-icons/fi';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitives.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitives.Root
    ref={ref}
    className={cn(
      'peer h-4 w-4 shrink-0 border border-gray-500 rounded-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 data-[state=checked]:bg-emerald-400/90 data-[state=checked]:border-emerald-400',
      className,
    )}
    {...props}
  >
    <CheckboxPrimitives.Indicator
      className={cn(
        'flex items-center justify-center text-slate-900 font-bold',
      )}
    >
      <FiCheck className="h-3 w-3" />
    </CheckboxPrimitives.Indicator>
  </CheckboxPrimitives.Root>
));
Checkbox.displayName = CheckboxPrimitives.Root.displayName;

export { Checkbox };
