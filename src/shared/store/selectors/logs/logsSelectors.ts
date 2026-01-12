import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../index';
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

/** Get the UI-only filter (view layer) */
export const selectUIFilter = createSelector(
  [selectLogsState],
  (logsState) => logsState.uiFilter,
);

/** Get the current view mode (perTool or globalFilter) */
export const selectViewMode = createSelector(
  [selectLogsState],
  (logsState) => logsState.viewMode,
);

/** Get the timestamp mode (relative or absolute) */
export const selectTimestampMode = createSelector(
  [selectLogsState],
  (logsState) => logsState.timestampMode,
);

/** Check if the logs WebSocket subscription is active */
export const selectIsSubscribed = createSelector(
  [selectLogsState],
  (logsState) => logsState.isSubscribed,
);

// Statistics selectors
/** Get total log counts by tool (all levels) - used to determine which tools have logs */
export const selectAllLogCountsByTool = createSelector(
  [selectLogsState],
  (logsState) => {
    const counts: Record<string, number> = {};

    // Count all logs from tool buffers
    Object.entries(logsState.buffers).forEach(([tool, logs]) => {
      counts[tool] = logs.length;
    });

    return counts;
  },
);

/** Get critical log counts by tool (error + warning only) - used for badge display */
export const selectCriticalLogCountsByTool = createSelector(
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
