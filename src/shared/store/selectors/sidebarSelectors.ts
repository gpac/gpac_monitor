import { createSelector } from '@reduxjs/toolkit';
import { selectLogsState, selectLevelsByTool, selectDefaultAllLevel } from './logsSelectors';

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
    const shouldInclude = (logLevel: number, tool: string): boolean => {
      // Never include debug in sidebar counts
      if (logLevel === 4) return false;

      // Parse config parts
      const configParts = configString.split(':');

      // Check tool-specific config first
      for (const part of configParts) {
        const [configTool, level] = part.split('@');
        if (configTool === tool) {
          const levelNum = getLevelNumber(level);
          return logLevel <= levelNum;
        }
      }

      // Fall back to 'all' config
      const allConfig = configParts.find(part => part.startsWith('all@'));
      if (allConfig) {
        const level = allConfig.split('@')[1];
        const levelNum = getLevelNumber(level);
        return logLevel <= levelNum;
      }

      // Default: warning and above
      return logLevel <= 2;
    };

    // Helper to convert level string to number
    const getLevelNumber = (level: string): number => {
      const levelMap = { 'error': 1, 'warning': 2, 'info': 3, 'debug': 4 };
      return levelMap[level as keyof typeof levelMap] || 2;
    };

    // Count logs across all tools
    Object.entries(logsState.buffers).forEach(([tool, logs]) => {
      logs.forEach(log => {
        if (!shouldInclude(log.level, tool)) return;

        if (log.level === 1) totalError++;
        else if (log.level === 2) totalWarning++;
        else if (log.level === 3) totalInfo++;
      });
    });

    return {
      error: totalError,
      warning: totalWarning,
      info: totalInfo
    };
  }
);