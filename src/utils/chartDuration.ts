/**
 * Chart duration utilities - Reusable across all chart types
 * (CPU, Session Stats, Audio, Memory, etc.)
 *
 * Note: Update intervals are component-specific:
 * - CPU: 150ms
 * - Session Stats: 1000ms
 */

export type ChartDuration = '20s' | '1min' | '5min' | 'unlimited';

/**
 * Maximum points for unlimited duration
 */
export const UNLIMITED_MAX_POINTS = 10000;

/**
 * Duration labels for UI display
 */
export const DURATION_LABELS: Record<ChartDuration, string> = {
  '20s': '20s',
  '1min': '1m',
  '5min': '5m',
  unlimited: '∞',
};

/**
 * Convert duration string to milliseconds
 *
 * @param duration - Chart duration ('20s', '1min', '5min', 'unlimited')
 * @returns Duration in milliseconds, or Infinity for unlimited
 */
export const getDurationInMs = (duration: ChartDuration): number => {
  switch (duration) {
    case '20s':
      return 20000;
    case '1min':
      return 60000;
    case '5min':
      return 300000;
    case 'unlimited':
      return Infinity;
    default:
      return 60000;
  }
};

/**
 * Calculate maximum number of points for a given duration and update interval
 *
 * @param duration - Chart duration
 * @param updateInterval - Update interval in milliseconds (component-specific)
 * @returns Maximum number of points to display
 */
export const getMaxPointsFromDuration = (
  duration: ChartDuration,
  updateInterval: number,
): number => {
  const durationMs = getDurationInMs(duration);
  if (durationMs === Infinity) {
    return UNLIMITED_MAX_POINTS;
  }
  return Math.ceil(durationMs / updateInterval);
};
