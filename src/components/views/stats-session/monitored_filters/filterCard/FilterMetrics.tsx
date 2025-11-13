import { memo } from 'react';

interface FilterMetricsProps {
  formattedPackets: string;
  formattedBytes: string;
  formattedTime: string;
  errors: number;
  hasPackets: boolean;
  hasTime: boolean;
}

/**
 * Displays only dynamic filter metrics (packets, bytes, time, errors)
 * Isolated to prevent parent re-renders when only metrics change
 */
export const FilterMetrics = memo(
  ({
    formattedPackets,
    formattedBytes,
    formattedTime,
    errors,
    hasPackets,
    hasTime,
  }: FilterMetricsProps) => {
    return (
      <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-monitor-text-muted">
        {hasPackets && (
          <>
            <span>{formattedPackets} pkt</span>
            <span className="text-monitor-text-subtle">•</span>
          </>
        )}
        {formattedBytes && (
          <>
            <span>{formattedBytes}</span>
            {hasTime && <span className="text-monitor-text-subtle">•</span>}
          </>
        )}
        {hasTime && <span>{formattedTime}</span>}
        {errors && errors > 0 && (
          <>
            <span className="text-monitor-text-subtle">•</span>
            <span className="text-rose-400">{errors} err</span>
          </>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if displayed metrics actually changed
    return (
      prevProps.formattedPackets === nextProps.formattedPackets &&
      prevProps.formattedBytes === nextProps.formattedBytes &&
      prevProps.formattedTime === nextProps.formattedTime &&
      prevProps.errors === nextProps.errors &&
      prevProps.hasPackets === nextProps.hasPackets &&
      prevProps.hasTime === nextProps.hasTime
    );
  },
);

FilterMetrics.displayName = 'FilterMetrics';
