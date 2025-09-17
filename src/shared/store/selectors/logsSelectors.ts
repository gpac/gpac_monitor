import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import {
  GpacLogEntry,
  GpacLogLevel,
  GpacLogTool,
} from '@/types/domain/gpac/log-types';

// Base selectors
/** Access the entire logs state */
const selectLogsState = (state: RootState) => state.logs;

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

/** Get effective level for a specific tool (levelsByTool[tool] ?? defaultAllLevel) */
export const selectEffectiveLevel = createSelector(
  [
    selectLevelsByTool,
    selectDefaultAllLevel,
    (_: RootState, tool: GpacLogTool) => tool,
  ],
  (levelsByTool, defaultAllLevel, tool): GpacLogLevel =>
    levelsByTool[tool as keyof typeof levelsByTool] ?? defaultAllLevel,
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

/** Get logs visible in UI, filtered by selected tool and its effective level */
export const selectVisibleLogs = createSelector(
  [selectLogsState, selectLevelsByTool, selectDefaultAllLevel],
  (logsState, levelsByTool, defaultAllLevel) => {
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

    // Get effective level for current tool
    const effectiveLevel =
      levelsByTool[logsState.currentTool] ?? defaultAllLevel;

    // Filter by effective level (preserving history in buffers)
    return filterLogsByLevel(rawLogs, effectiveLevel);
  },
);

/** Generate GPAC log config string for backend communication (format: "core@info,demux@warning,all@quiet") */
/** Create logs config string with ALL changed values (for complete backend sync) */
export const selectLogsConfigString = createSelector(
  [selectLevelsByTool, selectDefaultAllLevel],
  (levelsByTool, defaultAllLevel): string => {
    const configs: string[] = [];

    // Add tool-specific levels
    Object.entries(levelsByTool).forEach(([tool, level]) => {
      configs.push(`${tool}@${level}`);
    });

    // Add default level for 'all'
    configs.push(`all@${defaultAllLevel}`);

    return configs.join(',');
  },
);

/** Create optimized logs config string with ONLY changes from defaults */
export const selectLogsConfigChanges = createSelector(
  [selectLevelsByTool, selectDefaultAllLevel],
  (levelsByTool, defaultAllLevel): string => {
    const configs: string[] = [];

    // Only send user-defined tool levels (no defaults needed)
    Object.entries(levelsByTool).forEach(([tool, level]) => {
      configs.push(`${tool}@${level}`);
    });

    // Always send the base all@ level
    configs.push(`all@${defaultAllLevel}`);

    return configs.join(',');
  },
);

/** @deprecated - Legacy selector for backward compatibility */
export const selectGlobalLogConfig = selectLogsConfigString;

/** Get current logs configuration for localStorage persistence */
export const selectCurrentConfig = createSelector(
  [selectCurrentTool, selectLevelsByTool, selectDefaultAllLevel],
  (currentTool, levelsByTool, defaultAllLevel) => ({
    currentTool,
    levelsByTool,
    defaultAllLevel,
  }),
);
