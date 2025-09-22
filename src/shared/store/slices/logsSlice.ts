import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  GpacLogLevel,
  GpacLogTool,
  GpacLogEntry,
} from '@/types/domain/gpac/log-types';

/** Redux state for  logs management with per-tool levels and buffers */
interface LogsState {
  currentTool: GpacLogTool;
  levelsByTool: Record<GpacLogTool, GpacLogLevel>;
  defaultAllLevel: GpacLogLevel;
  buffers: Record<GpacLogTool, GpacLogEntry[]>;
  maxEntriesPerTool: number;
  isSubscribed: boolean;
  lastSentConfig: {
    levelsByTool: Record<GpacLogTool, GpacLogLevel>;
    defaultAllLevel: GpacLogLevel | null; // null means no config sent yet
  };
}

// Initialize state from localStorage
const getInitialState = (): LogsState => {
  const STORAGE_KEY = 'gpac-logs-config';

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const config = saved ? JSON.parse(saved) : {};

    return {
      currentTool: config.currentTool || GpacLogTool.FILTER,
      levelsByTool:
        config.levelsByTool || ({} as Record<GpacLogTool, GpacLogLevel>),
      defaultAllLevel: config.defaultAllLevel || GpacLogLevel.QUIET,
      buffers: {} as Record<GpacLogTool, GpacLogEntry[]>,
      maxEntriesPerTool: 5000,
      isSubscribed: false,
      lastSentConfig: {
        levelsByTool: {} as Record<GpacLogTool, GpacLogLevel>,
        defaultAllLevel: null, // Indicates no config has been sent yet
      },
    };
  } catch {
    return {
      currentTool: GpacLogTool.FILTER,
      levelsByTool: {} as Record<GpacLogTool, GpacLogLevel>,
      defaultAllLevel: GpacLogLevel.QUIET,
      buffers: {} as Record<GpacLogTool, GpacLogEntry[]>,
      maxEntriesPerTool: 5000,
      isSubscribed: false,
      lastSentConfig: {
        levelsByTool: {} as Record<GpacLogTool, GpacLogLevel>,
        defaultAllLevel: null, // Indicates no config has been sent yet
      },
    };
  }
};

const initialState: LogsState = getInitialState();

/** Initialize empty buffers for all GPAC tools */
Object.values(GpacLogTool).forEach((tool) => {
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

    /** Set level for a specific tool */
    setToolLevel: (
      state,
      action: PayloadAction<{ tool: GpacLogTool; level: GpacLogLevel }>,
    ) => {
      const { tool, level } = action.payload;
      state.levelsByTool[tool] = level;
    },

    /** Set the default level for 'all' tool (fallback) */
    setDefaultAllLevel: (state, action: PayloadAction<GpacLogLevel>) => {
      state.defaultAllLevel = action.payload;
    },

    appendLogs: (
      state,
      action: PayloadAction<{ tool: GpacLogTool; logs: GpacLogEntry[] }>,
    ) => {
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
      console.log(
        '[logsSlice] appendLogsForAllTools called with',
        logs.length,
        'logs',
      );

      if (logs.length === 0) return;

      // Group logs by tool
      const logsByTool: Record<string, GpacLogEntry[]> = {};
      logs.forEach((log) => {
        const tool = log.tool as GpacLogTool;
        if (!logsByTool[tool]) {
          logsByTool[tool] = [];
        }
        logsByTool[tool].push(log);
      });

      console.log('[logsSlice] Grouped logs by tool:', Object.keys(logsByTool));

      // Apply to each tool's buffer
      Object.entries(logsByTool).forEach(([tool, toolLogs]) => {
        const currentBuffer = state.buffers[tool as GpacLogTool] || [];
        const allLogs = [...currentBuffer, ...toolLogs];

        if (allLogs.length <= state.maxEntriesPerTool) {
          state.buffers[tool as GpacLogTool] = allLogs;
        } else {
          state.buffers[tool as GpacLogTool] = allLogs.slice(
            -state.maxEntriesPerTool,
          );
        }
        console.log(
          '[logsSlice] Updated buffer for tool',
          tool,
          'new size:',
          state.buffers[tool as GpacLogTool]?.length,
        );
      });
    },

    /** Clear all log buffers for all tools */
    clearAllBuffers: (state) => {
      Object.values(GpacLogTool).forEach((tool) => {
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
      Object.keys(state.buffers).forEach((tool) => {
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
    restoreConfig: (
      state,
      action: PayloadAction<{
        currentTool?: GpacLogTool;
        levelsByTool?: Record<GpacLogTool, GpacLogLevel>;
        defaultAllLevel?: GpacLogLevel;
      }>,
    ) => {
      const { currentTool, levelsByTool, defaultAllLevel } = action.payload;
      if (currentTool) {
        state.currentTool = currentTool;
      }
      if (levelsByTool) {
        state.levelsByTool = { ...state.levelsByTool, ...levelsByTool };
      }
      if (defaultAllLevel) {
        state.defaultAllLevel = defaultAllLevel;
      }
    },

    /** Mark current config as sent to backend */
    markConfigAsSent: (state) => {
      state.lastSentConfig = {
        levelsByTool: { ...state.levelsByTool },
        defaultAllLevel: state.defaultAllLevel,
      };
    },
  },
});

export const {
  setTool,
  setToolLevel,
  setDefaultAllLevel,
  appendLogs,
  appendLogsForAllTools,
  clearAllBuffers,
  clearBufferForTool,
  setMaxEntriesPerTool,
  setSubscriptionStatus,
  restoreConfig,
  markConfigAsSent,
} = logsSlice.actions;

export default logsSlice.reducer;
