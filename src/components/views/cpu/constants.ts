/**
 * CPU monitoring constants
 */

/**
 * CPU chart update interval in milliseconds
 * Used for chart data collection frequency
 */
export const CHART_CPU_UPDATE_INTERVAL = 150;

/**
 * Default chart history duration
 */
export const DEFAULT_CPU_HISTORY = '1min' as const;

/**
 * LocalStorage key for CPU history duration preference
 */
export const CPU_HISTORY_STORAGE_KEY = 'cpu-history-duration';
