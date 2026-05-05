import { formatBytes, formatBitrate } from '@/utils/formatting';

export const formatPidBuffer = (value: number | null | undefined): string =>
  value != null && !isNaN(value) ? formatBytes(value) : '—';

export const formatPidBitrate = (value: number | null | undefined): string =>
  value != null && !isNaN(value) ? formatBitrate(value) : '—';

export const formatPidCount = (value: number | null | undefined): string =>
  value != null ? value.toLocaleString() : '—';

export const formatPidPeak = (value: number | null | undefined): string =>
  value != null ? `${value}µs` : '—';
