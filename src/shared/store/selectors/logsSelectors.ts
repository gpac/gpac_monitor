import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import {
  GpacLogConfig,
  GpacLogEntry,
  GpacLogLevel,
} from '@/types/domain/gpac/log-types';

// Base selectors
/** Access the entire logs state */
const selectLogsState = (state: RootState) => state.logs;

/** Get the currently selected GPAC tool for log filtering */
export const selectCurrentTool = createSelector(
  [selectLogsState],
  (logsState) => logsState.currentTool,
);

/** Get the global log level filter setting */
export const selectGlobalLevel = createSelector(
  [selectLogsState],
  (logsState) => logsState.globalLevel,
);

/** Check if the logs WebSocket subscription is active */
export const selectIsSubscribed = createSelector(
  [selectLogsState],
  (logsState) => logsState.isSubscribed,
);

/** Filter log entries based on GPAC log level hierarchy */
const filterLogsByLevel = (
  logs: GpacLogEntry[],
  globalLevel: GpacLogLevel,
): GpacLogEntry[] => {
  const levelThresholds: Record<GpacLogLevel, number> = {
    [GpacLogLevel.QUIET]: 0,
    [GpacLogLevel.ERROR]: 1,
    [GpacLogLevel.WARNING]: 2,
    [GpacLogLevel.INFO]: 3,
    [GpacLogLevel.DEBUG]: 4,
  };

  const maxLevel = levelThresholds[globalLevel];
  if (globalLevel === GpacLogLevel.QUIET && maxLevel === 0) {
    return logs.filter((log: GpacLogEntry) => log.level === 0);
  }

  // Filter by threshold: show all logs <= maxLevel
  return logs.filter((log: GpacLogEntry) => log.level <= maxLevel);
};

/** Get logs visible in UI, filtered by selected tool and global level */
export const selectVisibleLogs = createSelector(
  [selectLogsState],
  (logsState) => {
    let rawLogs: GpacLogEntry[];

    if (logsState.currentTool === 'all') {
      // If "all" is selected, get all logs from all tools
      rawLogs = Object.values(logsState.buffers)
        .flat()
        .sort((a, b) => a.timestamp - b.timestamp);
    } else {
      // Otherwise, get only logs from the selected tool
      rawLogs = logsState.buffers[logsState.currentTool] || [];
    }

    // Filter by current global level (preserving history in buffers)
    return filterLogsByLevel(rawLogs, logsState.globalLevel);
  },
);

/** Generate GPAC log config string for backend communication (format: "all@level") */
export const selectGlobalLogConfig = createSelector(
  [selectGlobalLevel],
  (globalLevel): GpacLogConfig => `all@${globalLevel}`,
);

/** Get current logs configuration for localStorage persistence */
export const selectCurrentConfig = createSelector(
  [selectCurrentTool, selectGlobalLevel],
  (currentTool, globalLevel) => ({
    currentTool,
    globalLevel,
  }),
);
