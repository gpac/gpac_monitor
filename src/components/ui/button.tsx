import { cn } from '@/utils/core';
import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium ',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500',
          'disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-orange-800 text-white hover:bg-orange-900':
              variant === 'default',
            'bg-red-700 text-white hover:bg-red-800': variant === 'destructive',
            'bg-transparent border border-gray-600 hover:bg-gray-900/50':
              variant === 'outline',
            'bg-transparent hover:bg-gray-700/50': variant === 'ghost',
            'bg-transparent text-blue-500 underline-offset-4 hover:underline':
              variant === 'link',
          },
          {
            'px-4 py-2': size === 'default',
            'px-3 py-1 text-xs': size === 'sm',
            'px-6 py-3': size === 'lg',
          },
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';
