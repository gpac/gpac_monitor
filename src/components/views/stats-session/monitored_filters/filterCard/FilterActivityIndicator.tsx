import { memo } from 'react';

interface FilterActivityIndicatorProps {
  activityColor: string;
  activityLabel: string;
}

/**
 * Displays dynamic activity indicator (color dot + label)
 * Isolated to prevent parent re-renders when activity changes
 */
export const FilterActivityIndicator = memo(
  ({ activityColor, activityLabel }: FilterActivityIndicatorProps) => {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <div className={`h-2 w-2 rounded-full ${activityColor}`} />
        <span className="text-xs font-medium text-monitor-text-secondary">
          {activityLabel}
        </span>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.activityColor === nextProps.activityColor &&
      prevProps.activityLabel === nextProps.activityLabel
    );
  },
);

FilterActivityIndicator.displayName = 'FilterActivityIndicator';
