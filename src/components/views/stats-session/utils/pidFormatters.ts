import { formatBitrate, formatTime } from '@/utils/formatting';

// buffer is in microseconds
export const formatPidBuffer = (value: number | null | undefined): string => {
  if (value == null || isNaN(value) || value < 0) return '—';
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

type TsFraction = { n: number; d: number } | { num: number; den: number };

export const formatLastTsSent = (
  ts: TsFraction | number | null | undefined,
): string => {
  if (ts == null) return '—';
  if (typeof ts === 'number') return ts > 0 ? `${ts.toFixed(2)}s` : '—';
  const num = 'n' in ts ? ts.n : ts.num;
  const den = 'n' in ts ? ts.d : ts.den;
  if (!den) return '—';
  return `${(num / den).toFixed(2)}s`;
};
