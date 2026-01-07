import { memo } from 'react';

interface StableNumberProps {
  value: number;
  className?: string;
  maxValue?: number;
  format?: (n: number) => string;
}

/**
 * Stable number display for live counters that update frequently.
 * Prevents CLS (Cumulative Layout Shift) with fixed width.
 * Uses tabular-nums for monospaced digits.
 *
 * Default: Shows exact count if < maxValue (default 100), otherwise "+{maxValue}"
 */
export const StableNumber = memo<StableNumberProps>(
  ({ value, className = '', maxValue = 100, format }) => {
    const displayValue = format
      ? format(value)
      : value >= maxValue
        ? `+${maxValue}`
        : String(value);

    return <span className={`stat-num ${className}`}>{displayValue}</span>;
  },
  (prev, next) => prev.value === next.value,
);

StableNumber.displayName = 'StableNumber';
