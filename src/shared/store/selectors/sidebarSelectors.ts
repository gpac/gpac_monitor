import { createSelector } from '@reduxjs/toolkit';
import {
  selectLogsState,
  selectLevelsByTool,
  selectDefaultAllLevel,
} from './logsSelectors';
import { GpacLogLevel, GpacLogTool, LOG_LEVEL_VALUES } from '@/types/domain/gpac/log-types';

export interface SidebarLogCounts {
  error: number;
  warning: number;
  info: number;
}

/**
 * Sidebar Log Counts - Filtered according to stored config, excludes debug
 * Used by Sidebar to display persistent log counts
 */
export const selectLogCounts = createSelector(
  [selectLogsState, selectLevelsByTool, selectDefaultAllLevel],
  (logsState, levelsByTool, defaultAllLevel): SidebarLogCounts => {
    let totalError = 0;
    let totalWarning = 0;
    let totalInfo = 0;

    // Build config string from current state (fallback to all@warning)
    const buildConfigString = (): string => {
      const configs: string[] = [];
      configs.push(`all@${defaultAllLevel}`);
      Object.entries(levelsByTool).forEach(([tool, level]) => {
        configs.push(`${tool}@${level}`);
      });
      return configs.join(':');
    };

    const configString = defaultAllLevel ? buildConfigString() : 'all@warning';

    // Helper to check if log level should be included
    const shouldInclude = (logLevel: number, tool: GpacLogTool | string): boolean => {
      // Never include debug in sidebar counts
      if (logLevel === LOG_LEVEL_VALUES[GpacLogLevel.DEBUG]) return false;

      // Parse config parts
      const configParts = configString.split(':');

      // Check tool-specific config first
      for (const part of configParts) {
        const [configTool, level] = part.split('@');
        if (configTool === tool) {
          const levelNum = getLevelNumber(level as GpacLogLevel);
          return logLevel <= levelNum;
        }
      }

      // Fall back to 'all' config
      const allConfig = configParts.find((part) => part.startsWith('all@'));
      if (allConfig) {
        const level = allConfig.split('@')[1] as GpacLogLevel;
        const levelNum = getLevelNumber(level);
        return logLevel <= levelNum;
      }

      // Default: warning and above
      return logLevel <= LOG_LEVEL_VALUES[GpacLogLevel.WARNING];
    };

    // Helper to convert level string to number using typed constants
    const getLevelNumber = (level: GpacLogLevel): number => {
      return LOG_LEVEL_VALUES[level] || LOG_LEVEL_VALUES[GpacLogLevel.WARNING];
    };

    // Count logs across all tools
    Object.entries(logsState.buffers).forEach(([tool, logs]) => {
      logs.forEach((log) => {
        if (!shouldInclude(log.level, tool)) return;

        if (log.level === LOG_LEVEL_VALUES[GpacLogLevel.ERROR]) totalError++;
        else if (log.level === LOG_LEVEL_VALUES[GpacLogLevel.WARNING]) totalWarning++;
        else if (log.level === LOG_LEVEL_VALUES[GpacLogLevel.INFO]) totalInfo++;
      });
    });

    return {
      error: totalError,
      warning: totalWarning,
      info: totalInfo,
    };
  },
);
