/**
 * Time formatting utilities
 */

type TsFraction = { n: number; d: number } | { num: number; den: number };

/** Formats a µs duration to a human-readable string. Returns '—' for invalid values. */
export const formatMicroseconds = (
  value: number | null | undefined,
): string => {
  if (value == null || isNaN(value) || value < 0) return '—';
  if (value < 1000) return `${Math.round(value)}µs`;
  if (value < 1_000_000) return `${(value / 1000).toFixed(1)}ms`;
  return `${(value / 1_000_000).toFixed(2)}s`;
};

/** Formats a GPAC last_ts_sent value ({n,d}, {num,den} or raw seconds). */
export const formatLastTsSent = (
  ts: TsFraction | number | null | undefined,
): string => {
  if (ts == null) return '—';
  let seconds: number | null;
  if (typeof ts === 'number') {
    seconds = ts > 0 ? ts : null;
  } else {
    const num = 'n' in ts ? ts.n : ts.num;
    const den = 'n' in ts ? ts.d : ts.den;
    seconds = den ? num / den : null;
  }
  return seconds != null ? `${seconds.toFixed(2)}s` : '—';
};

export const formatTime = (microseconds?: number): string => {
  if (microseconds === undefined) return '0 ms';
  if (microseconds < 1000) return `${microseconds.toFixed(0)} μs`;

  const milliseconds = microseconds / 1000;
  if (milliseconds < 1000) return `${milliseconds.toFixed(2)} ms`;

  const seconds = milliseconds / 1000;
  if (seconds < 60) return `${seconds.toFixed(2)} s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds.toFixed(0)}s`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m ${remainingSeconds.toFixed(0)}s`;
};

export const microsecondsToSeconds = (microseconds: number): number => {
  return microseconds / 1_000_000;
};

/** Formats a GPAC status time fraction (num/den) as a human-readable duration. */
export const formatFractionAsTime = (num: number, den: number): string => {
  if (den === 0) return '—';
  const seconds = num / den;
  if (seconds < 60) return `${seconds.toFixed(2)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  if (mins < 60) return `${mins}:${secs}`;
  const hours = Math.floor(mins / 60);
  const remainingMins = (mins % 60).toString().padStart(2, '0');
  return `${hours}:${remainingMins}:${secs}`;
};

/** Formats a GPAC time fraction as readable duration plus the raw fraction, e.g. "21.32s (1918917/90000)". */
export const formatFractionAsTimeWithRaw = (
  num: number,
  den: number,
): string => {
  if (den === 0) return '—';
  return `${formatFractionAsTime(num, den)} (${num}/${den})`;
};

/**
 * Formats current time as HH:MM:SS for chart display
 */
export const formatChartTime = (): string => {
  return new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatChartTimeFromUs = (microseconds: number): string =>
  new Date(microseconds / 1000).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

export const formatBufferTime = (microseconds: number): string => {
  if (microseconds === 0) return '0 ms';
  const milliseconds = microseconds / 1000;
  if (milliseconds >= 1000) return `${(milliseconds / 1000).toFixed(1)} s`;
  return `${Math.floor(milliseconds)} ms`;
};

/**
 * Format seconds for chart X-axis display
 * 0-60s -> "Xs", 60-3600s -> "Xm Ys", >3600s -> "Xh Ym"
 */
export const formatChartSeconds = (seconds: number): string => {
  if (seconds < 60) return `${seconds.toFixed(0)}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};
