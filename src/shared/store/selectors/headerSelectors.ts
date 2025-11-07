import { createSelector } from '@reduxjs/toolkit';
import {
  selectLogsState,
  selectLevelsByTool,
  selectDefaultAllLevel,
} from './logs/logsSelectors';
import { GpacLogLevel, LOG_LEVEL_VALUES } from '@/types/domain/gpac/log-types';

export interface HeaderLogCounts {
  error: number;
  warning: number;
  info: number;
}

/**
 * Header Log Counts - Filtered according to stored config, excludes debug
 * Used by Header to display persistent log counts
 *
 * PERFORMANCE OPTIMIZED:
 * - Pre-computes level thresholds as Map (O(1) lookup)
 * - Single pass through logs (O(n))
 * - No string splitting in hot path
 */
export const selectLogCounts = createSelector(
  [selectLogsState, selectLevelsByTool, selectDefaultAllLevel],
  (logsState, levelsByTool, defaultAllLevel): HeaderLogCounts => {
    // Pre-compute level thresholds for each tool (O(nbTools), done once)
    const levelThresholds = new Map<string, number>();

    // Default 'all' level
    const allLevelNum = defaultAllLevel
      ? LOG_LEVEL_VALUES[defaultAllLevel]
      : LOG_LEVEL_VALUES[GpacLogLevel.WARNING];

    // Tool-specific levels
    Object.entries(levelsByTool).forEach(([tool, level]) => {
      levelThresholds.set(tool, LOG_LEVEL_VALUES[level] || allLevelNum);
    });

    const debugLevelNum = LOG_LEVEL_VALUES[GpacLogLevel.DEBUG];
    const errorLevelNum = LOG_LEVEL_VALUES[GpacLogLevel.ERROR];
    const warningLevelNum = LOG_LEVEL_VALUES[GpacLogLevel.WARNING];
    const infoLevelNum = LOG_LEVEL_VALUES[GpacLogLevel.INFO];

    let totalError = 0;
    let totalWarning = 0;
    let totalInfo = 0;

    // Single pass through all logs (O(nbLogs))
    for (const [tool, logs] of Object.entries(logsState.buffers)) {
      const threshold = levelThresholds.get(tool) ?? allLevelNum;

      for (const log of logs) {
        // Skip debug logs
        if (log.level === debugLevelNum) continue;

        // Skip logs above threshold
        if (log.level > threshold) continue;

        // Count by level
        if (log.level === errorLevelNum) totalError++;
        else if (log.level === warningLevelNum) totalWarning++;
        else if (log.level === infoLevelNum) totalInfo++;
      }
    }

    return {
      error: totalError,
      warning: totalWarning,
      info: totalInfo,
    };
  },
);
