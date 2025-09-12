import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { GpacLogConfig, GpacLogEntry, GpacLogLevel } from '@/types/domain/gpac/log-types';

// Base selectors
const selectLogsState = (state: RootState) => state.logs;

export const selectCurrentTool = createSelector(
  [selectLogsState],
  (logsState) => logsState.currentTool
);

export const selectGlobalLevel = createSelector(
  [selectLogsState],
  (logsState) => logsState.globalLevel
);

export const selectIsSubscribed = createSelector(
  [selectLogsState],
  (logsState) => logsState.isSubscribed
);

// Helper function to filter logs by GPAC level
const filterLogsByLevel = (logs: GpacLogEntry[], globalLevel: GpacLogLevel): GpacLogEntry[] => {
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

// Main selector: logs visible in the UI (filtered by tool AND level)
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
  }
);

//  for the backend (always "all@level")
export const selectGlobalLogConfig = createSelector(
  [selectGlobalLevel],
  (globalLevel): GpacLogConfig => `all@${globalLevel}`
);

// Configuration for persistence
export const selectCurrentConfig = createSelector(
  [selectCurrentTool, selectGlobalLevel],
  (currentTool, globalLevel) => ({
    currentTool,
    globalLevel
  })
);