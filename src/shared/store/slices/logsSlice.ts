import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GpacLogLevel, GpacLogTool, GpacLogEntry } from '@/types/domain/gpac/log-types';

/** Redux state for GPAC logs management with tool-specific buffers and filtering */
interface LogsState {
  currentTool: GpacLogTool;
  globalLevel: GpacLogLevel;
  buffers: Record<GpacLogTool, GpacLogEntry[]>;
  maxEntriesPerTool: number;
  isSubscribed: boolean;
}

const initialState: LogsState = {
  currentTool: GpacLogTool.ALL,
  globalLevel: GpacLogLevel.INFO,
  buffers: {} as Record<GpacLogTool, GpacLogEntry[]>,
  maxEntriesPerTool: 5000,
  isSubscribed: false,
};

/** Initialize empty buffers for all GPAC tools */
Object.values(GpacLogTool).forEach(tool => {
  initialState.buffers[tool] = [];
});

const logsSlice = createSlice({
  name: 'logs',
  initialState,
  reducers: {
    /** Set the currently active GPAC tool for log filtering */
    setTool: (state, action: PayloadAction<GpacLogTool>) => {
      state.currentTool = action.payload;
    },
    
    /** Update the global log level filter */
    setGlobalLevel: (state, action: PayloadAction<GpacLogLevel>) => {
      state.globalLevel = action.payload;
    },
    
 
    appendLogs: (state, action: PayloadAction<{ tool: GpacLogTool; logs: GpacLogEntry[] }>) => {
      const { tool, logs } = action.payload;
      
      if (logs.length === 0) return;
      
      const currentBuffer = state.buffers[tool] || [];
      const allLogs = [...currentBuffer, ...logs];
      
      // Apply  ring buffer logic
      if (allLogs.length <= state.maxEntriesPerTool) {
        state.buffers[tool] = allLogs;
      } else {
        state.buffers[tool] = allLogs.slice(-state.maxEntriesPerTool);
      }
    },
    
    /** Distribute and append logs to appropriate tool buffers based on log.tool property */
    appendLogsForAllTools: (state, action: PayloadAction<GpacLogEntry[]>) => {
      const logs = action.payload;
      
      if (logs.length === 0) return;
      
      // Group logs by tool
      const logsByTool: Record<string, GpacLogEntry[]> = {};
      logs.forEach(log => {
        const tool = log.tool as GpacLogTool;
        if (!logsByTool[tool]) {
          logsByTool[tool] = [];
        }
        logsByTool[tool].push(log);
      });
      
      // Apply to each tool's buffer
      Object.entries(logsByTool).forEach(([tool, toolLogs]) => {
        const currentBuffer = state.buffers[tool as GpacLogTool] || [];
        const allLogs = [...currentBuffer, ...toolLogs];
        
        if (allLogs.length <= state.maxEntriesPerTool) {
          state.buffers[tool as GpacLogTool] = allLogs;
        } else {
          state.buffers[tool as GpacLogTool] = allLogs.slice(-state.maxEntriesPerTool);
        }
      });
    },
    
    /** Clear all log buffers for all tools */
    clearAllBuffers: (state) => {
      Object.values(GpacLogTool).forEach(tool => {
        state.buffers[tool] = [];
      });
    },
    
    /** Clear log buffer for a specific tool */
    clearBufferForTool: (state, action: PayloadAction<GpacLogTool>) => {
      state.buffers[action.payload] = [];
    },
    
    /** Update buffer size limit and truncate existing buffers if needed */
    setMaxEntriesPerTool: (state, action: PayloadAction<number>) => {
      state.maxEntriesPerTool = action.payload;
      
      // Apply new limit to all existing buffers
      Object.keys(state.buffers).forEach(tool => {
        const buffer = state.buffers[tool as GpacLogTool];
        if (buffer.length > action.payload) {
          state.buffers[tool as GpacLogTool] = buffer.slice(-action.payload);
        }
      });
    },
    
    /** Track WebSocket logs subscription status */
    setSubscriptionStatus: (state, action: PayloadAction<boolean>) => {
      state.isSubscribed = action.payload;
    },
    
    /** Restore logs configuration from localStorage persistence */
    restoreConfig: (state, action: PayloadAction<{ currentTool?: GpacLogTool; globalLevel?: GpacLogLevel }>) => {
      const { currentTool, globalLevel } = action.payload;
      if (currentTool) {
        state.currentTool = currentTool;
      }
      if (globalLevel) {
        state.globalLevel = globalLevel;
      }
    }
  },
});

export const {
  setTool,
  setGlobalLevel,
  appendLogs,
  appendLogsForAllTools,
  clearAllBuffers,
  clearBufferForTool,
  setMaxEntriesPerTool,
  setSubscriptionStatus,
  restoreConfig,
} = logsSlice.actions;

export default logsSlice.reducer;