/**
 * CPU monitoring constants
 */

/**
 * CPU stats server interval in milliseconds.
 * Must match UPDATE_INTERVALS.CPU_STATS in server/JSClient/config.js.
 * Used to compute maxPoints for the chart buffer.
 */
export const CPU_SERVER_INTERVAL = 500;

/**
 * Default chart history duration
 */
export const DEFAULT_CPU_HISTORY = '1min' as const;

/**
 * LocalStorage key for CPU history duration preference
 */
export const CPU_HISTORY_STORAGE_KEY = 'cpu-history-duration';
