import { createSelector } from '@reduxjs/toolkit';
import {
  GpacLogEntry,
  GpacLogLevel,
  LOG_LEVEL_VALUES,
} from '@/types/domain/gpac/log-types';
import {
  selectLogsState,
  selectLevelsByTool,
  selectDefaultAllLevel,
  selectVisibleToolsFilter,
  selectUIFilter,
} from './logsSelectors';

/** Filter log entries based on log level hierarchy */
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

/** Get logs visible in UI, filtered by selected tool and its effective level */
export const selectVisibleLogs = createSelector(
  [
    selectLogsState,
    selectLevelsByTool,
    selectDefaultAllLevel,
    selectVisibleToolsFilter,
    selectUIFilter,
  ],
  (logsState, levelsByTool, defaultAllLevel, visibleToolsFilter, uiFilter) => {
    let rawLogs: GpacLogEntry[];

    // UI Filter active = force ALL mode (show logs from ALL configured tools)
    const isUIFilterActive = uiFilter && uiFilter.length > 0;
    const isAllMode =
      isUIFilterActive || (visibleToolsFilter && visibleToolsFilter.length > 1);

    if (isAllMode) {
      // ALL mode: show logs from all tools
      const toolsToInclude = Object.keys(logsState.buffers);

      // Get logs from all tools
      rawLogs = toolsToInclude
        .map(
          (tool) =>
            logsState.buffers[tool as keyof typeof logsState.buffers] || [],
        )
        .flat()
        .sort((a, b) => a.timestamp - b.timestamp);
    } else {
      // Single tool selected - get only logs from that tool
      rawLogs = logsState.buffers[logsState.currentTool] || [];

      // For specific tools, get effective level and filter
      // Use the tool's configured level if it exists, otherwise use the default
      const effectiveLevel =
        levelsByTool[logsState.currentTool] ?? defaultAllLevel;

      // Filter by effective level (preserving history in buffers)
      rawLogs = filterLogsByLevel(rawLogs, effectiveLevel);
    }

    // Apply UI filter (Layer 2: view layer) if present
    if (isUIFilterActive) {
      const allowedLevels = uiFilter.map((level) => LOG_LEVEL_VALUES[level]);
      rawLogs = rawLogs.filter((log) => allowedLevels.includes(log.level));
    }

    return rawLogs;
  },
);

/** Count only warning and error logs for UX display */
export const selectCriticalLogsCount = createSelector(
  [selectVisibleLogs],
  (visibleLogs) => {
    // level is numeric: 1=error, 2=warning
    return visibleLogs.filter((log) => log.level === 1 || log.level === 2)
      .length;
  },
);
