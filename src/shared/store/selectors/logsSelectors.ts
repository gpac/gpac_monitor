import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

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
/** Get log counts by tool for performance monitoring */
export const selectLogCountsByTool = createSelector(
  [selectLogsState],
  (logsState) => {
    const counts: Record<string, number> = {};

    // Count logs from all tool buffers
    Object.entries(logsState.buffers).forEach(([tool, logs]) => {
      counts[tool] = logs.length;
    });

    return counts;
  },
);
