import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { LOG_LEVEL_VALUES, GpacLogLevel } from '@/types/domain/gpac/log-types';

// Base selectors - Direct state access
/** Access the entire logs state */
export const selectLogsState = (state: RootState) => state.logs;

/** Get the currently selected GPAC tool for log filtering */
export const selectCurrentTool = createSelector(
  [selectLogsState],
  (logsState) => logsState.currentTool,
);

/** Get the levels by tool mapping */
export const selectLevelsByTool = createSelector(
  [selectLogsState],
  (logsState) => logsState.levelsByTool,
);

/** Get the default level for 'all' tool */
export const selectDefaultAllLevel = createSelector(
  [selectLogsState],
  (logsState) => logsState.defaultAllLevel,
);

/** Get the visible tools filter for 'all' mode */
export const selectVisibleToolsFilter = createSelector(
  [selectLogsState],
  (logsState) => logsState.visibleToolsFilter,
);

/** Check if the logs WebSocket subscription is active */
export const selectIsSubscribed = createSelector(
  [selectLogsState],
  (logsState) => logsState.isSubscribed,
);

// Statistics selectors
/** Get log counts by tool for performance monitoring (only critical: error + warning) */
export const selectLogCountsByTool = createSelector(
  [selectLogsState],
  (logsState) => {
    const counts: Record<string, number> = {};

    // Count only critical logs (error + warning) from tool buffers
    const errorLevel = LOG_LEVEL_VALUES[GpacLogLevel.ERROR];
    const warningLevel = LOG_LEVEL_VALUES[GpacLogLevel.WARNING];

    Object.entries(logsState.buffers).forEach(([tool, logs]) => {
      const criticalCount = logs.filter(
        (log) => log.level === errorLevel || log.level === warningLevel,
      ).length;
      counts[tool] = criticalCount;
    });

    return counts;
  },
);
