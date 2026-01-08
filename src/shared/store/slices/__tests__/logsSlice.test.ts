import { describe, it, expect, beforeEach, vi } from 'vitest';
import logsReducer, {
  setDefaultAllLevel,
  setToolLevel,
} from '../logs/logs.slice';
import { GpacLogTool, GpacLogLevel } from '@/types/domain/gpac/log-types';
import type { LogsState } from '../logs/logs.types';

// Mock localStorage
beforeEach(() => {
  global.localStorage = {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  } as any;
});

describe('setDefaultAllLevel - Reset Tool Levels', () => {
  it('should reset all tool-specific levels when changing default level', () => {
    // Initial state with some tool-specific levels
    let state: LogsState = {
      currentTool: GpacLogTool.FILTER,
      levelsByTool: {
        [GpacLogTool.CORE]: GpacLogLevel.DEBUG,
        [GpacLogTool.FILTER]: GpacLogLevel.INFO,
        [GpacLogTool.MUTEX]: GpacLogLevel.WARNING,
      } as any,
      defaultAllLevel: GpacLogLevel.ERROR,
      visibleToolsFilter: [],
      buffers: {} as any,
      maxEntriesPerTool: 500,
      isSubscribed: false,
      highlightedLogId: null,
      uiFilter: null,
      viewMode: 'perTool',
      lastSentConfig: {
        levelsByTool: {} as any,
        defaultAllLevel: null,
      },
      alertsByFilterKey: {},
    };

    // Change default level
    state = logsReducer(state, setDefaultAllLevel(GpacLogLevel.QUIET));

    // Verify levelsByTool is empty
    expect(state.defaultAllLevel).toBe(GpacLogLevel.QUIET);
    expect(Object.keys(state.levelsByTool)).toHaveLength(0);
  });

  it('should reset levelsByTool even with many tools configured', () => {
    let state: LogsState = {
      currentTool: GpacLogTool.ALL,
      levelsByTool: {
        [GpacLogTool.MMIO]: GpacLogLevel.INFO,
        [GpacLogTool.FILTER]: GpacLogLevel.INFO,
        [GpacLogTool.MEDIA]: GpacLogLevel.WARNING,
        [GpacLogTool.AUDIO]: GpacLogLevel.INFO,
        [GpacLogTool.CODING]: GpacLogLevel.INFO,
      } as any,
      defaultAllLevel: GpacLogLevel.ERROR,
      visibleToolsFilter: [],
      buffers: {} as any,
      maxEntriesPerTool: 500,
      isSubscribed: false,
      highlightedLogId: null,
      uiFilter: null,
      viewMode: 'perTool',
      lastSentConfig: {
        levelsByTool: {} as any,
        defaultAllLevel: null,
      },
      alertsByFilterKey: {},
    };

    // Change to all@quiet
    state = logsReducer(state, setDefaultAllLevel(GpacLogLevel.QUIET));

    // All tools should be reset
    expect(state.defaultAllLevel).toBe(GpacLogLevel.QUIET);
    expect(state.levelsByTool).toEqual({});
  });

  it('should allow setting tool-specific level after reset', () => {
    let state: LogsState = {
      currentTool: GpacLogTool.FILTER,
      levelsByTool: {
        [GpacLogTool.CORE]: GpacLogLevel.DEBUG,
      } as any,
      defaultAllLevel: GpacLogLevel.ERROR,
      visibleToolsFilter: [],
      buffers: {} as any,
      maxEntriesPerTool: 500,
      isSubscribed: false,
      highlightedLogId: null,
      uiFilter: null,
      viewMode: 'perTool',
      lastSentConfig: {
        levelsByTool: {} as any,
        defaultAllLevel: null,
      },
      alertsByFilterKey: {},
    };

    // Reset all
    state = logsReducer(state, setDefaultAllLevel(GpacLogLevel.QUIET));
    expect(state.levelsByTool).toEqual({});

    // Set specific tool level
    state = logsReducer(
      state,
      setToolLevel({ tool: GpacLogTool.FILTER, level: GpacLogLevel.DEBUG }),
    );

    // Only filter should be set
    expect(state.levelsByTool).toEqual({
      [GpacLogTool.FILTER]: GpacLogLevel.DEBUG,
    });
    expect(state.defaultAllLevel).toBe(GpacLogLevel.QUIET);
  });
});
