/**
 * Bandwidth Chart Configuration
 * Constants and configuration for real-time bandwidth monitoring
 */

/** Maximum data points to retain (5 minutes at 1Hz) */
export const MAX_POINTS = 300;

/** Default refresh interval in milliseconds (1 second for real-time) */
export const DEFAULT_REFRESH_INTERVAL = 1000;

/** Chart height in pixels */
export const CHART_HEIGHT = 150;

/** Chart margins */
export const CHART_MARGIN = { top: 5, right: 10, left: 10, bottom: 5 };

/**
 * Color configuration for upload/download bandwidth
 */
export const BANDWIDTH_COLORS = {
  sent: '#10b981', // Green for upload
  received: '#3b82f6', // Blue for download
} as const;

/**
 * Chart titles for different bandwidth types
 */
export const CHART_TITLES = {
  sent: 'Upload Bandwidth',
  received: 'Download Bandwidth',
} as const;

/**
 * Y-axis configuration
 */
export const Y_AXIS_CONFIG = {
  width: 80,
  domain: ['auto', 'auto'],
  allowDataOverflow: true,
};

/**
 * Tooltip content styling
 */
export const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--background))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '6px',
  fontSize: '12px',
};

/**
 * X-axis tick configuration
 */
export const X_AXIS_TICK = {
  fontSize: 10,
};

/**
 * Y-axis tick configuration
 */
export const Y_AXIS_TICK = {
  fontSize: 10,
};
