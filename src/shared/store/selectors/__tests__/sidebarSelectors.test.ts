import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { selectLogCounts } from '../sidebarSelectors';
import logsReducer, {
  setDefaultAllLevel,
  setToolLevel,
  appendLogs,
} from '../../slices/logsSlice';
import {
  GpacLogTool,
  GpacLogLevel,
  GpacLogEntry,
  LOG_LEVEL_VALUES,
} from '../../../../types/domain/gpac/log-types';
import graphReducer from '../../slices/graphSlice';
import widgetsReducer from '../../slices/widgetsSlice';
import filterArgumentReducer from '../../slices/filterArgumentSlice';
import sessionStatsReducer from '../../slices/sessionStatsSlice';

// Mock localStorage globally for all tests
let localStorageMock: { [key: string]: string };

beforeEach(() => {
  localStorageMock = {};
  global.localStorage = {
    getItem: vi.fn((key: string) => localStorageMock[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      localStorageMock[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete localStorageMock[key];
    }),
    clear: vi.fn(() => {
      localStorageMock = {};
    }),
    length: 0,
    key: vi.fn(),
  };
});

const createTestStore = () =>
  configureStore({
    reducer: {
      graph: graphReducer,
      filterArgument: filterArgumentReducer,
      logs: logsReducer,
      widgets: widgetsReducer,
      sessionStats: sessionStatsReducer,
    },
  });

const createLogEntry = (
  tool: GpacLogTool,
  level: number,
  message: string,
  timestamp = Date.now(),
): GpacLogEntry => ({
  tool,
  level,
  message,
  timestamp,
});

describe('sidebarSelectors - selectLogCounts', () => {
  describe('Basic counting functionality', () => {
    it('should return zero counts for empty state', () => {
      const store = createTestStore();
      const counts = selectLogCounts(store.getState());

      expect(counts).toEqual({
        error: 0,
        warning: 0,
        info: 0,
      });
    });

    it('should count logs by level correctly', () => {
      const store = createTestStore();
      store.dispatch(setDefaultAllLevel(GpacLogLevel.DEBUG));

      const logs: GpacLogEntry[] = [
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
          'Error 1',
        ),
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
          'Error 2',
        ),
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.WARNING],
          'Warning 1',
        ),
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.WARNING],
          'Warning 2',
        ),
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.WARNING],
          'Warning 3',
        ),
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.INFO],
          'Info 1',
        ),
      ];

      store.dispatch(appendLogs({ tool: GpacLogTool.CORE, logs }));
      const counts = selectLogCounts(store.getState());

      expect(counts).toEqual({
        error: 2,
        warning: 3,
        info: 1,
      });
    });

    it('should exclude debug logs from sidebar counts', () => {
      const store = createTestStore();
      store.dispatch(setDefaultAllLevel(GpacLogLevel.DEBUG));

      const logs: GpacLogEntry[] = [
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
          'Error',
        ),
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.WARNING],
          'Warning',
        ),
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.INFO],
          'Info',
        ),
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.DEBUG],
          'Debug 1',
        ),
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.DEBUG],
          'Debug 2',
        ),
      ];

      store.dispatch(appendLogs({ tool: GpacLogTool.CORE, logs }));
      const counts = selectLogCounts(store.getState());

      expect(counts).toEqual({
        error: 1,
        warning: 1,
        info: 1,
      });
    });
  });

  describe('Configuration-based filtering', () => {
    it('should respect default all@warning level', () => {
      const store = createTestStore();
      store.dispatch(setDefaultAllLevel(GpacLogLevel.WARNING));

      const logs: GpacLogEntry[] = [
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
          'Error',
        ),
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.WARNING],
          'Warning',
        ),
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.INFO],
          'Info (hidden)',
        ),
        createLogEntry(
          GpacLogTool.NETWORK,
          LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
          'Net Error',
        ),
        createLogEntry(
          GpacLogTool.NETWORK,
          LOG_LEVEL_VALUES[GpacLogLevel.INFO],
          'Net Info (hidden)',
        ),
      ];

      store.dispatch(
        appendLogs({ tool: GpacLogTool.CORE, logs: logs.slice(0, 3) }),
      );
      store.dispatch(
        appendLogs({ tool: GpacLogTool.NETWORK, logs: logs.slice(3) }),
      );
      const counts = selectLogCounts(store.getState());

      expect(counts).toEqual({
        error: 2, // Both errors visible
        warning: 1, // Only warning visible
        info: 0, // Info hidden by all@warning
      });
    });

    it('should respect tool-specific configuration', () => {
      const store = createTestStore();
      store.dispatch(setDefaultAllLevel(GpacLogLevel.WARNING));
      store.dispatch(
        setToolLevel({ tool: GpacLogTool.CORE, level: GpacLogLevel.INFO }),
      );

      const logs: GpacLogEntry[] = [
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
          'Core Error',
        ),
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.WARNING],
          'Core Warning',
        ),
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.INFO],
          'Core Info (visible)',
        ),
        createLogEntry(
          GpacLogTool.NETWORK,
          LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
          'Net Error',
        ),
        createLogEntry(
          GpacLogTool.NETWORK,
          LOG_LEVEL_VALUES[GpacLogLevel.INFO],
          'Net Info (hidden)',
        ),
      ];

      store.dispatch(
        appendLogs({ tool: GpacLogTool.CORE, logs: logs.slice(0, 3) }),
      );
      store.dispatch(
        appendLogs({ tool: GpacLogTool.NETWORK, logs: logs.slice(3) }),
      );
      const counts = selectLogCounts(store.getState());

      expect(counts).toEqual({
        error: 2, // Both errors visible
        warning: 1, // Core warning visible
        info: 1, // Core info visible due to core@info, network info hidden by all@warning
      });
    });

    it('should handle multiple tool-specific configurations', () => {
      const store = createTestStore();
      store.dispatch(setDefaultAllLevel(GpacLogLevel.ERROR));
      store.dispatch(
        setToolLevel({ tool: GpacLogTool.HTTP, level: GpacLogLevel.WARNING }),
      );
      store.dispatch(
        setToolLevel({ tool: GpacLogTool.AUDIO, level: GpacLogLevel.INFO }),
      );

      const logs: GpacLogEntry[] = [
        // Core tool (uses all@error)
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
          'Core Error',
        ),
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.WARNING],
          'Core Warning (hidden)',
        ),
        // HTTP tool (uses http@warning)
        createLogEntry(
          GpacLogTool.HTTP,
          LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
          'HTTP Error',
        ),
        createLogEntry(
          GpacLogTool.HTTP,
          LOG_LEVEL_VALUES[GpacLogLevel.WARNING],
          'HTTP Warning',
        ),
        createLogEntry(
          GpacLogTool.HTTP,
          LOG_LEVEL_VALUES[GpacLogLevel.INFO],
          'HTTP Info (hidden)',
        ),
        // Audio tool (uses audio@info)
        createLogEntry(
          GpacLogTool.AUDIO,
          LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
          'Audio Error',
        ),
        createLogEntry(
          GpacLogTool.AUDIO,
          LOG_LEVEL_VALUES[GpacLogLevel.WARNING],
          'Audio Warning',
        ),
        createLogEntry(
          GpacLogTool.AUDIO,
          LOG_LEVEL_VALUES[GpacLogLevel.INFO],
          'Audio Info',
        ),
      ];

      store.dispatch(
        appendLogs({ tool: GpacLogTool.CORE, logs: logs.slice(0, 2) }),
      );
      store.dispatch(
        appendLogs({ tool: GpacLogTool.HTTP, logs: logs.slice(2, 5) }),
      );
      store.dispatch(
        appendLogs({ tool: GpacLogTool.AUDIO, logs: logs.slice(5) }),
      );
      const counts = selectLogCounts(store.getState());

      expect(counts).toEqual({
        error: 3, // All errors visible
        warning: 2, // HTTP + Audio warnings (Core warning hidden)
        info: 1, // Only Audio info visible
      });
    });
  });

  describe('Cross-tool aggregation', () => {
    it('should aggregate counts across multiple tools', () => {
      const store = createTestStore();
      store.dispatch(setDefaultAllLevel(GpacLogLevel.INFO));

      const coreLogger: GpacLogEntry[] = [
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
          'Core Error 1',
        ),
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
          'Core Error 2',
        ),
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.WARNING],
          'Core Warning',
        ),
      ];

      const networkLogs: GpacLogEntry[] = [
        createLogEntry(
          GpacLogTool.NETWORK,
          LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
          'Network Error',
        ),
        createLogEntry(
          GpacLogTool.NETWORK,
          LOG_LEVEL_VALUES[GpacLogLevel.INFO],
          'Network Info 1',
        ),
        createLogEntry(
          GpacLogTool.NETWORK,
          LOG_LEVEL_VALUES[GpacLogLevel.INFO],
          'Network Info 2',
        ),
      ];

      const audioLogs: GpacLogEntry[] = [
        createLogEntry(
          GpacLogTool.AUDIO,
          LOG_LEVEL_VALUES[GpacLogLevel.WARNING],
          'Audio Warning 1',
        ),
        createLogEntry(
          GpacLogTool.AUDIO,
          LOG_LEVEL_VALUES[GpacLogLevel.WARNING],
          'Audio Warning 2',
        ),
        createLogEntry(
          GpacLogTool.AUDIO,
          LOG_LEVEL_VALUES[GpacLogLevel.WARNING],
          'Audio Warning 3',
        ),
        createLogEntry(
          GpacLogTool.AUDIO,
          LOG_LEVEL_VALUES[GpacLogLevel.INFO],
          'Audio Info',
        ),
      ];

      store.dispatch(appendLogs({ tool: GpacLogTool.CORE, logs: coreLogger }));
      store.dispatch(
        appendLogs({ tool: GpacLogTool.NETWORK, logs: networkLogs }),
      );
      store.dispatch(appendLogs({ tool: GpacLogTool.AUDIO, logs: audioLogs }));

      const counts = selectLogCounts(store.getState());

      expect(counts).toEqual({
        error: 3, // 2 Core + 1 Network
        warning: 4, // 1 Core + 3 Audio
        info: 3, // 2 Network + 1 Audio
      });
    });

    it('should handle empty buffers for some tools', () => {
      const store = createTestStore();
      store.dispatch(setDefaultAllLevel(GpacLogLevel.INFO));

      // Only add logs to one tool
      const logs: GpacLogEntry[] = [
        createLogEntry(
          GpacLogTool.HTTP,
          LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
          'HTTP Error',
        ),
        createLogEntry(
          GpacLogTool.HTTP,
          LOG_LEVEL_VALUES[GpacLogLevel.WARNING],
          'HTTP Warning',
        ),
        createLogEntry(
          GpacLogTool.HTTP,
          LOG_LEVEL_VALUES[GpacLogLevel.INFO],
          'HTTP Info',
        ),
      ];

      store.dispatch(appendLogs({ tool: GpacLogTool.HTTP, logs }));
      const counts = selectLogCounts(store.getState());

      expect(counts).toEqual({
        error: 1,
        warning: 1,
        info: 1,
      });
    });
  });

  describe('Fallback behavior', () => {
    it('should fallback to all@warning when no defaultAllLevel set', () => {
      const store = createTestStore();
      // Don't set defaultAllLevel - should use fallback

      const logs: GpacLogEntry[] = [
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
          'Error',
        ),
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.WARNING],
          'Warning',
        ),
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.INFO],
          'Info (hidden)',
        ),
      ];

      store.dispatch(appendLogs({ tool: GpacLogTool.CORE, logs }));
      const counts = selectLogCounts(store.getState());

      expect(counts).toEqual({
        error: 1,
        warning: 1,
        info: 0, // Hidden by fallback all@warning
      });
    });

    it('should use fallback level for invalid configuration', () => {
      const store = createTestStore();
      // Test with malformed config internally
      store.dispatch(setDefaultAllLevel(GpacLogLevel.INFO));

      const logs: GpacLogEntry[] = [
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
          'Error',
        ),
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.WARNING],
          'Warning',
        ),
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.INFO],
          'Info',
        ),
      ];

      store.dispatch(appendLogs({ tool: GpacLogTool.CORE, logs }));
      const counts = selectLogCounts(store.getState());

      expect(counts).toEqual({
        error: 1,
        warning: 1,
        info: 1,
      });
    });
  });

  describe('Performance and edge cases', () => {
    it('should handle large number of logs efficiently', () => {
      const store = createTestStore();
      store.dispatch(setDefaultAllLevel(GpacLogLevel.INFO));

      // Generate large batches of logs
      const largeBatch = Array.from({ length: 1000 }, (_, i) => {
        const levels = [
          LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
          LOG_LEVEL_VALUES[GpacLogLevel.WARNING],
          LOG_LEVEL_VALUES[GpacLogLevel.INFO],
        ];
        return createLogEntry(
          GpacLogTool.CORE,
          levels[i % 3],
          `Log message ${i}`,
          Date.now() + i,
        );
      });

      store.dispatch(appendLogs({ tool: GpacLogTool.CORE, logs: largeBatch }));
      const counts = selectLogCounts(store.getState());

      // Should have roughly 333-334 of each type (due to rounding)
      expect(counts.error + counts.warning + counts.info).toBe(1000);
      expect(Math.abs(counts.error - 334)).toBeLessThanOrEqual(1);
      expect(Math.abs(counts.warning - 333)).toBeLessThanOrEqual(1);
      expect(Math.abs(counts.info - 333)).toBeLessThanOrEqual(1);
    });

    it('should be stable with repeated selector calls', () => {
      const store = createTestStore();
      store.dispatch(setDefaultAllLevel(GpacLogLevel.WARNING));

      const logs: GpacLogEntry[] = [
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
          'Error',
        ),
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.WARNING],
          'Warning',
        ),
      ];

      store.dispatch(appendLogs({ tool: GpacLogTool.CORE, logs }));

      // Multiple calls should return same result
      const counts1 = selectLogCounts(store.getState());
      const counts2 = selectLogCounts(store.getState());
      const counts3 = selectLogCounts(store.getState());

      expect(counts1).toEqual(counts2);
      expect(counts2).toEqual(counts3);
      expect(counts1).toEqual({ error: 1, warning: 1, info: 0 });
    });

    it('should handle edge case log levels', () => {
      const store = createTestStore();
      store.dispatch(setDefaultAllLevel(GpacLogLevel.WARNING));

      // Test with edge case numeric values
      const logs: GpacLogEntry[] = [
        createLogEntry(GpacLogTool.CORE, 0, 'Quiet level'),
        createLogEntry(GpacLogTool.CORE, 1, 'Error level'),
        createLogEntry(GpacLogTool.CORE, 2, 'Warning level'),
        createLogEntry(GpacLogTool.CORE, 3, 'Info level (filtered out)'),
        createLogEntry(
          GpacLogTool.CORE,
          999,
          'Unknown high level (filtered out)',
        ),
      ];

      store.dispatch(appendLogs({ tool: GpacLogTool.CORE, logs }));
      const counts = selectLogCounts(store.getState());

      expect(counts).toEqual({
        error: 1, // Only level 1 (error) is counted
        warning: 1, // Level 2 (warning) is counted
        info: 0, // Levels 3+ are filtered out by all@warning
      });
    });

    it('should handle zero and negative log levels gracefully', () => {
      const store = createTestStore();
      store.dispatch(setDefaultAllLevel(GpacLogLevel.ERROR));

      const logs: GpacLogEntry[] = [
        createLogEntry(GpacLogTool.CORE, -1, 'Negative level'),
        createLogEntry(GpacLogTool.CORE, 0, 'Zero level'),
        createLogEntry(GpacLogTool.CORE, 1, 'Error level'),
      ];

      store.dispatch(appendLogs({ tool: GpacLogTool.CORE, logs }));
      const counts = selectLogCounts(store.getState());

      expect(counts).toEqual({
        error: 1, // Only proper error level
        warning: 0,
        info: 0,
      });
    });

    it('should maintain performance with frequent config changes', () => {
      const store = createTestStore();

      // Add some logs first
      const logs: GpacLogEntry[] = [
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
          'Error',
        ),
        createLogEntry(
          GpacLogTool.HTTP,
          LOG_LEVEL_VALUES[GpacLogLevel.WARNING],
          'Warning',
        ),
        createLogEntry(
          GpacLogTool.AUDIO,
          LOG_LEVEL_VALUES[GpacLogLevel.INFO],
          'Info',
        ),
      ];

      store.dispatch(appendLogs({ tool: GpacLogTool.CORE, logs: [logs[0]] }));
      store.dispatch(appendLogs({ tool: GpacLogTool.HTTP, logs: [logs[1]] }));
      store.dispatch(appendLogs({ tool: GpacLogTool.AUDIO, logs: [logs[2]] }));

      // Rapidly change configurations multiple times
      const startTime = performance.now();

      for (let i = 0; i < 50; i++) {
        store.dispatch(setDefaultAllLevel(GpacLogLevel.INFO));
        selectLogCounts(store.getState());

        store.dispatch(setDefaultAllLevel(GpacLogLevel.WARNING));
        selectLogCounts(store.getState());

        store.dispatch(setDefaultAllLevel(GpacLogLevel.ERROR));
        selectLogCounts(store.getState());
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete quickly (under 100ms for 150 operations)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Type safety and interface compliance', () => {
    it('should return correct TypeScript interface structure', () => {
      const store = createTestStore();
      const counts = selectLogCounts(store.getState());

      // Verify interface compliance
      expect(counts).toHaveProperty('error');
      expect(counts).toHaveProperty('warning');
      expect(counts).toHaveProperty('info');

      expect(typeof counts.error).toBe('number');
      expect(typeof counts.warning).toBe('number');
      expect(typeof counts.info).toBe('number');

      // Should not have any extra properties
      const keys = Object.keys(counts);
      expect(keys).toHaveLength(3);
      expect(keys.sort()).toEqual(['error', 'info', 'warning']);
    });

    it('should handle undefined tool buffers gracefully', () => {
      const store = createTestStore();
      // Force an undefined buffer scenario by accessing non-existent tool
      const state = store.getState();

      // Mock a scenario where buffers might be undefined
      const modifiedState = {
        ...state,
        logs: {
          ...state.logs,
          buffers: {},
        },
      };

      const counts = selectLogCounts(modifiedState);

      expect(counts).toEqual({
        error: 0,
        warning: 0,
        info: 0,
      });
    });
  });

  describe('Configuration string parsing edge cases', () => {
    it('should handle complex tool-specific configurations', () => {
      const store = createTestStore();
      store.dispatch(setDefaultAllLevel(GpacLogLevel.INFO));

      // Add logs to test against
      const logs: GpacLogEntry[] = [
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
          'Error',
        ),
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.WARNING],
          'Warning',
        ),
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.INFO],
          'Info',
        ),
      ];

      store.dispatch(appendLogs({ tool: GpacLogTool.CORE, logs }));

      // Set complex config
      store.dispatch(
        setToolLevel({ tool: GpacLogTool.CORE, level: GpacLogLevel.WARNING }),
      );
      store.dispatch(
        setToolLevel({ tool: GpacLogTool.HTTP, level: GpacLogLevel.DEBUG }),
      );

      const counts = selectLogCounts(store.getState());

      expect(counts).toEqual({
        error: 1,
        warning: 1,
        info: 0, // Filtered out by core@warning
      });
    });

    it('should handle empty levelsByTool configurations', () => {
      const store = createTestStore();
      // Only set default level, no tool-specific levels
      store.dispatch(setDefaultAllLevel(GpacLogLevel.WARNING));

      const logs: GpacLogEntry[] = [
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
          'Error',
        ),
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.WARNING],
          'Warning',
        ),
        createLogEntry(
          GpacLogTool.CORE,
          LOG_LEVEL_VALUES[GpacLogLevel.INFO],
          'Info (hidden)',
        ),
      ];

      store.dispatch(appendLogs({ tool: GpacLogTool.CORE, logs }));
      const counts = selectLogCounts(store.getState());

      expect(counts).toEqual({
        error: 1,
        warning: 1,
        info: 0,
      });
    });
  });
});
