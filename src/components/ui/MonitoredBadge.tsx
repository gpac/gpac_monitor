import { memo } from 'react';
import { LuEye } from 'react-icons/lu';
import { Badge } from '@/components/ui/badge';

interface MonitoredBadgeProps {
  /**
   * Whether the item is being monitored
   */
  isMonitored: boolean;
  /**
   * Badge variant (default: red for high visibility)
   */
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
  /**
   * Custom className for additional styling
   */
  className?: string;
  /**
   * Optional custom tooltip text
   */
  title?: string;
}

/**
 * Reusable badge component to indicate monitored status
 * Displays an eye icon with a colored ring for visual distinction
 *
 * @example
 * ```tsx
 * <MonitoredBadge isMonitored={true} />
 * <MonitoredBadge isMonitored={filter.isDetached} title="Filter is actively monitored" />
 * ```
 */
export const MonitoredBadge = memo(
  ({
    isMonitored,
    variant = 'outline',
    className = '',
    title = 'Item is monitored',
  }: MonitoredBadgeProps) => {
    if (!isMonitored) return null;

    return (
      <Badge
        variant={variant}
        className={`flex h-5 items-center gap-1 px-1 ring-1 ring-red-600/90 text-slate-900/90 bg-red-200 ${className}`}
        title={title}
      >
        <LuEye className="h-4 w-4" />
      </Badge>
    );
  },
);

MonitoredBadge.displayName = 'MonitoredBadge';
