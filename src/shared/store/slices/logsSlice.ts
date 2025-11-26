import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  GpacLogLevel,
  GpacLogTool,
  GpacLogEntry,
} from '@/types/domain/gpac/log-types';
import { LogId } from '@/components/views/logs/utils/logIdentifier';

/** View mode for LogMonitor UI */
export type LogViewMode = 'perTool' | 'globalFilter';

/** Redux state for  logs management with per-tool levels and buffers */
interface LogsState {
  currentTool: GpacLogTool;
  levelsByTool: Record<GpacLogTool, GpacLogLevel>;
  defaultAllLevel: GpacLogLevel;
  visibleToolsFilter: GpacLogTool[]; // Tools to display when in "all" mode (empty = show all)
  buffers: Record<GpacLogTool, GpacLogEntry[]>;
  maxEntriesPerTool: number;
  isSubscribed: boolean;
  highlightedLogId: LogId | null; // ID of the currently highlighted log (session only)
  uiFilter: GpacLogLevel[] | null; // UI-only filter (e.g., [ERROR] or [ERROR, WARNING])
  viewMode: LogViewMode; // Current view mode (perTool or globalFilter)
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
      visibleToolsFilter: config.visibleToolsFilter || [],
      buffers: {} as Record<GpacLogTool, GpacLogEntry[]>,
      maxEntriesPerTool: 1000,
      isSubscribed: false,
      highlightedLogId: null,
      uiFilter: null,
      viewMode: 'perTool' as LogViewMode,
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
      visibleToolsFilter: [],
      buffers: {} as Record<GpacLogTool, GpacLogEntry[]>,
      maxEntriesPerTool: 1000,
      isSubscribed: false,
      highlightedLogId: null,
      uiFilter: null,
      viewMode: 'perTool' as LogViewMode,
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

    /** Toggle tool visibility in "all" mode */
    toggleToolInVisibleFilter: (state, action: PayloadAction<GpacLogTool>) => {
      const tool = action.payload;
      const index = state.visibleToolsFilter.indexOf(tool);

      if (index === -1) {
        state.visibleToolsFilter.push(tool);
      } else {
        state.visibleToolsFilter.splice(index, 1);
      }
    },

    /** Clear all tools from visible filter (show all) */
    clearVisibleToolsFilter: (state) => {
      state.visibleToolsFilter = [];
    },

    /** Select all configured tools in visible filter */
    selectAllToolsInFilter: (state, action: PayloadAction<GpacLogTool[]>) => {
      state.visibleToolsFilter = [...action.payload];
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
      if (logs.length === 0) return;

      const { buffers, maxEntriesPerTool } = state;

      // push direct
      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        const tool = log.tool as GpacLogTool;

        let buffer = buffers[tool];
        if (!buffer) {
          buffer = buffers[tool] = [];
        }

        buffer.push(log);
      }

      // 2) trim per tool
      for (const tool in buffers) {
        const buffer = buffers[tool as GpacLogTool]!;
        const overflow = buffer.length - maxEntriesPerTool;
        if (overflow > 0) {
          // mutation in-place
          buffer.splice(0, overflow);
        }
      }
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
        visibleToolsFilter?: GpacLogTool[];
      }>,
    ) => {
      const { currentTool, levelsByTool, defaultAllLevel, visibleToolsFilter } =
        action.payload;
      if (currentTool) {
        state.currentTool = currentTool;
      }
      if (levelsByTool) {
        state.levelsByTool = { ...state.levelsByTool, ...levelsByTool };
      }
      if (defaultAllLevel) {
        state.defaultAllLevel = defaultAllLevel;
      }
      if (visibleToolsFilter) {
        state.visibleToolsFilter = visibleToolsFilter;
      }
    },

    /** Mark current config as sent to backend */
    markConfigAsSent: (state) => {
      state.lastSentConfig = {
        levelsByTool: { ...state.levelsByTool },
        defaultAllLevel: state.defaultAllLevel,
      };
    },

    /** Set the currently highlighted log (for visual tracking across filters) */
    setHighlightedLog: (state, action: PayloadAction<LogId | null>) => {
      state.highlightedLogId = action.payload;
    },

    /** Set UI-only filter for log levels (doesn't affect backend config) */
    setUIFilter: (state, action: PayloadAction<GpacLogLevel[]>) => {
      state.uiFilter = action.payload;
      state.viewMode = 'globalFilter'; // Switch to global filter mode
    },

    /** Clear UI-only filter (show all logs according to config) */
    clearUIFilter: (state) => {
      state.uiFilter = null;
      state.viewMode = 'perTool'; // Return to per-tool mode
    },
  },
});

export const {
  setTool,
  setToolLevel,
  setDefaultAllLevel,
  toggleToolInVisibleFilter,
  clearVisibleToolsFilter,
  selectAllToolsInFilter,
  appendLogs,
  appendLogsForAllTools,
  setMaxEntriesPerTool,
  setSubscriptionStatus,
  restoreConfig,
  markConfigAsSent,
  setHighlightedLog,
  setUIFilter,
  clearUIFilter,
} = logsSlice.actions;

export default logsSlice.reducer;
