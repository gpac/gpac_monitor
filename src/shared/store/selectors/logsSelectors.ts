import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { GpacLogEntry, GpacLogLevel } from '@/types/domain/gpac/log-types';

// Base selectors
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

/** Filter log entries based  log level hierarchy */
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
  ],
  (logsState, levelsByTool, defaultAllLevel, visibleToolsFilter) => {
    let rawLogs: GpacLogEntry[];

    // Check if we're in ALL mode (filters active) or single tool mode (default)
    const isAllMode = visibleToolsFilter && visibleToolsFilter.length > 0;

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

      return rawLogs;
    }

    // Single tool selected - get only logs from that tool
    rawLogs = logsState.buffers[logsState.currentTool] || [];

    // For specific tools, get effective level and filter
    // Use the tool's configured level if it exists, otherwise use the default
    const effectiveLevel =
      levelsByTool[logsState.currentTool] ?? defaultAllLevel;

    // Filter by effective level (preserving history in buffers)
    const filteredLogs = filterLogsByLevel(rawLogs, effectiveLevel);

    return filteredLogs;
  },
);

/** Generate GPAC log config string for backend communication (format: "core@info,demux@warning,all@quiet") */
/** Create logs config string with ALL changed values (for complete backend sync) */
export const selectLogsConfigString = createSelector(
  [selectLevelsByTool, selectDefaultAllLevel],
  (levelsByTool, defaultAllLevel): string => {
    const configs: string[] = [];

    // Add default level for 'all' FIRST to set the base
    configs.push(`all@${defaultAllLevel}`);

    // Then add tool-specific levels (they will override the default)
    Object.entries(levelsByTool).forEach(([tool, level]) => {
      configs.push(`${tool}@${level}`);
    });

    const result = configs.join(',');
    return result;
  },
);

/** Create optimized logs config string with ONLY changes from last sent config */
export const selectLogsConfigChanges = createSelector(
  [selectLogsState],
  (logsState): string => {
    const { levelsByTool, defaultAllLevel, lastSentConfig } = logsState;
    const configs: string[] = [];

    // Check if default level changed (null means no config sent yet)
    if (
      lastSentConfig.defaultAllLevel === null ||
      defaultAllLevel !== lastSentConfig.defaultAllLevel
    ) {
      configs.push(`all@${defaultAllLevel}`);
    }

    // Check for changed tool levels
    Object.entries(levelsByTool).forEach(([tool, level]) => {
      const lastSentLevel =
        lastSentConfig.levelsByTool[
          tool as keyof typeof lastSentConfig.levelsByTool
        ];
      if (level !== lastSentLevel) {
        configs.push(`${tool}@${level}`);
      }
    });

    // Check for removed tool levels (tools that were configured but now removed)
    Object.entries(lastSentConfig.levelsByTool).forEach(([tool, _]) => {
      if (!(tool in levelsByTool)) {
        // Tool was removed, reset it to default by sending all@level
        configs.push(`${tool}@${defaultAllLevel}`);
      }
    });

    const result = configs.join(':');
    return result;
  },
);

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

/** Get current logs configuration for localStorage persistence */
export const selectCurrentConfig = createSelector(
  [
    selectCurrentTool,
    selectLevelsByTool,
    selectDefaultAllLevel,
    selectVisibleToolsFilter,
  ],
  (currentTool, levelsByTool, defaultAllLevel, visibleToolsFilter) => ({
    currentTool,
    levelsByTool,
    defaultAllLevel,
    visibleToolsFilter,
  }),
);
