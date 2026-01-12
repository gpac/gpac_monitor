import {
  GpacLogLevel,
  GpacLogTool,
  GpacLogEntry,
} from '@/types/domain/gpac/log-types';
import { LogsState } from './logs.types';

const STORAGE_KEY = 'gpac-logs-config';

/** Initialize state from localStorage */
export const getInitialLogsState = (): LogsState => {
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
      maxEntriesPerTool: 500,
      isSubscribed: false,
      highlightedLogId: null,
      uiFilter: null,
      viewMode: 'perTool' as const,
      timestampMode: 'relative' as const,
      lastSentConfig: {
        levelsByTool: {} as Record<GpacLogTool, GpacLogLevel>,
        defaultAllLevel: null, // Indicates no config has been sent yet
      },
      alertsByFilterKey: {},
    };
  } catch {
    return {
      currentTool: GpacLogTool.FILTER,
      levelsByTool: {} as Record<GpacLogTool, GpacLogLevel>,
      defaultAllLevel: GpacLogLevel.QUIET,
      visibleToolsFilter: [],
      buffers: {} as Record<GpacLogTool, GpacLogEntry[]>,
      maxEntriesPerTool: 500,
      isSubscribed: false,
      highlightedLogId: null,
      uiFilter: null,
      viewMode: 'perTool' as const,
      timestampMode: 'relative' as const,
      lastSentConfig: {
        levelsByTool: {} as Record<GpacLogTool, GpacLogLevel>,
        defaultAllLevel: null,
      },
      alertsByFilterKey: {},
    };
  }
};
