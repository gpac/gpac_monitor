import { formatBitrate, formatTime } from '@/utils/formatting';

// buffer is in microseconds
export const formatPidBuffer = (value: number | null | undefined): string => {
  if (value == null || isNaN(value)) return '—';
  if (value < 1000) return `${value}µs`;
  if (value < 1_000_000) return `${(value / 1000).toFixed(1)}ms`;
  return `${(value / 1_000_000).toFixed(2)}s`;
};

export const formatPidBitrate = (value: number | null | undefined): string =>
  value != null && !isNaN(value) ? formatBitrate(value) : '—';

export const formatPidCount = (value: number | null | undefined): string =>
  value != null ? value.toLocaleString() : '—';

export const formatPidPeak = (value: number | null | undefined): string =>
  value != null ? formatTime(value) : '—';
