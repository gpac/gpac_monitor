/**
 * Time formatting utilities
 */

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
  if (microseconds === 0) return 1; // Avoid division by zero
  const milliseconds = microseconds / 1000;
  return milliseconds / 1000;
};

/**
 * Formats current time as HH:MM:SS for chart display
 */
export const formatChartTime = (): string => {
  return new Date().toLocaleTimeString('en-US', {
    hour12: false,
    minute: '2-digit',
    second: '2-digit',
  });
};

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

/**
 * Format time in compact form for dashboard display
 * Input: microseconds from GPAC (f.time)
 * Output: Compact readable format
 * - < 1ms: "123μs"
 * - < 1s: "45ms"
 * - < 1min: "12.3s"
 * - < 1h: "22:59" (mm:ss format)
 * - >= 1h: "1:23h" (h:mm format)
 */
export const formatCompactTime = (microseconds?: number): string => {
  if (microseconds === undefined || microseconds === 0) return '0ms';

  // < 1ms: show microseconds
  if (microseconds < 1000) return `${microseconds.toFixed(0)}μs`;

  const milliseconds = microseconds / 1000;

  // < 1s: show milliseconds
  if (milliseconds < 1000) return `${milliseconds.toFixed(0)}ms`;

  const seconds = milliseconds / 1000;

  // < 1min: show seconds with 1 decimal
  if (seconds < 60) return `${seconds.toFixed(1)}s`;

  const totalMinutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  // < 1h: show mm:ss format
  if (totalMinutes < 60) {
    const mm = totalMinutes.toString().padStart(2, '0');
    const ss = remainingSeconds.toString().padStart(2, '0');
    return `${mm}:${ss}`;
  }

  // >= 1h: show h:mm format
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const mmFormatted = minutes.toString().padStart(2, '0');
  return `${hours}:${mmFormatted}h`;
};

