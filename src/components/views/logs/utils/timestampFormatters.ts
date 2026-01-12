/**
 * Log-specific timestamp formatting utilities
 * Optimized for compact display in log entries
 */

/**
 * Format relative log timestamp from sys.clock_us
 * Compact format for long sessions:
 * - < 1min: "12.345s" (with milliseconds)
 * - < 1h: "5m23s" (minutes + seconds)
 * - >= 1h: "2h15m" (hours + minutes, max 6 chars)
 */
export const formatLogTimestampRelative = (microseconds: number): string => {
  const totalSeconds = microseconds / 1000000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const ms = Math.floor((totalSeconds % 1) * 1000);

  if (hours > 0) {
    return `${hours}h${minutes.toString().padStart(2, '0')}m`;
  } else if (minutes > 0) {
    return `${minutes}m${seconds.toString().padStart(2, '0')}s`;
  } else {
    return `${seconds}.${ms.toString().padStart(3, '0')}s`;
  }
};

/**
 * Format absolute log timestamp from Date.now()
 * Returns: "HH:MM:SS.mmm" (12 chars max)
 */
export const formatLogTimestampAbsolute = (timestampMs: number): string => {
  return (
    new Date(timestampMs).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }) +
    '.' +
    String(timestampMs % 1000).padStart(3, '0')
  );
};
