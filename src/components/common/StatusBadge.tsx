import { memo } from 'react';
import { Badge } from '@/components/ui/badge';

const COLOR_SCHEMES = {
  red: 'bg-red-400/90 text-slate-200 border-red-700/60',
  amber: 'bg-amber-900/20 text-amber-300 border-amber-700/60',
  violet: 'bg-violet-900/20 text-violet-300 border-violet-700/60',
  emerald: 'bg-emerald-900/15 text-emerald-300 border-emerald-700/60',
  blue: 'bg-blue-900/20 text-blue-300 border-blue-700/60',
} as const;

export type BadgeColorScheme = keyof typeof COLOR_SCHEMES;

export interface StatusBadgeProps {
  label: string;
  colorScheme: BadgeColorScheme;
  visible?: boolean;
  title?: string;
  onClick?: () => void;
  className?: string;
}

const BASE_CLASS =
  'h-5 px-1.5 text-[10px] uppercase tracking-wide border rounded-sm font-semibold transition-opacity duration-300';

export const StatusBadge = memo(
  ({
    label,
    colorScheme,
    visible = true,
    title,
    onClick,
    className = '',
  }: StatusBadgeProps) => {
    if (!visible) return null;

    return (
      <Badge
        variant="outline"
        className={`${BASE_CLASS} ${COLOR_SCHEMES[colorScheme]} ${onClick ? 'cursor-pointer' : ''} ${className}`}
        title={title}
        onClick={onClick}
      >
        {label}
      </Badge>
    );
  },
);

StatusBadge.displayName = 'StatusBadge';
