import * as React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'warning'
    | 'logs';
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  // Different style variants for the badge
  const variantStyles = {
    default:
      'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
    secondary:
      'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    warning:
      'border-yellow-600 bg-black text-yellow-600 shadow hover:bg-warning/80',
    destructive:
      'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
    outline: 'text-foreground bg-primary',
    logs: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 px-1 py-0 text-gray-900 font-normal',

    success: 'bg-green-600/20 text-green-400 border-green-500/30',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
