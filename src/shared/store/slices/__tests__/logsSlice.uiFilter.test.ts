import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import logsReducer, {
  setUIFilter,
  clearUIFilter,
  appendLogs,
} from '../logsSlice';
import { selectVisibleLogs } from '../../selectors/logs/logsFilterSelectors';
import { selectViewMode } from '../../selectors/logs/logsSelectors';
import {
  GpacLogTool,
  GpacLogLevel,
  GpacLogEntry,
} from '../../../../types/domain/gpac/log-types';
import graphReducer from '../graphSlice';
import widgetsReducer from '../widgetsSlice';
import filterArgumentReducer from '../filterArgumentSlice';
import sessionStatsReducer from '../sessionStatsSlice';

// Mock localStorage
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
): GpacLogEntry => ({
  tool,
  level,
  message,
  timestamp: Date.now(),
});

describe('UI Filter - Layer 2 Architecture', () => {
  it('should set uiFilter and switch to globalFilter viewMode', () => {
    const store = createTestStore();

    // Initial state
    expect(store.getState().logs.uiFilter).toBeNull();
    expect(selectViewMode(store.getState())).toBe('perTool');

    // Set UI filter
    store.dispatch(setUIFilter({ levels: [GpacLogLevel.ERROR] }));

    // Verify state
    expect(store.getState().logs.uiFilter).toEqual({
      levels: [GpacLogLevel.ERROR],
    });
    expect(selectViewMode(store.getState())).toBe('globalFilter');
  });

  it('should set uiFilter with filterKeys only', () => {
    const store = createTestStore();

    store.dispatch(setUIFilter({ filterKeys: ['12', 't:42'] }));

    expect(store.getState().logs.uiFilter).toEqual({
      filterKeys: ['12', 't:42'],
    });
    expect(selectViewMode(store.getState())).toBe('globalFilter');
  });

  it('should set uiFilter with levels and filterKeys', () => {
    const store = createTestStore();

    store.dispatch(
      setUIFilter({
        levels: [GpacLogLevel.ERROR, GpacLogLevel.WARNING],
        filterKeys: ['t:7'],
      }),
    );

    expect(store.getState().logs.uiFilter).toEqual({
      levels: [GpacLogLevel.ERROR, GpacLogLevel.WARNING],
      filterKeys: ['t:7'],
    });
    expect(selectViewMode(store.getState())).toBe('globalFilter');
  });

  it('should clear uiFilter and return to perTool viewMode', () => {
    const store = createTestStore();

    // Set filter first
    store.dispatch(setUIFilter({ levels: [GpacLogLevel.WARNING] }));
    expect(selectViewMode(store.getState())).toBe('globalFilter');

    // Clear filter
    store.dispatch(clearUIFilter());

    // Verify state
    expect(store.getState().logs.uiFilter).toBeNull();
    expect(selectViewMode(store.getState())).toBe('perTool');
  });

  it('should show logs from ALL tools when uiFilter active', () => {
    const store = createTestStore();

    // Add logs to multiple tools
    store.dispatch(
      appendLogs({
        tool: GpacLogTool.FILTER,
        logs: [
          createLogEntry(GpacLogTool.FILTER, 1, 'Filter error'),
          createLogEntry(GpacLogTool.FILTER, 2, 'Filter warning'),
        ],
      }),
    );

    store.dispatch(
      appendLogs({
        tool: GpacLogTool.MMIO,
        logs: [
          createLogEntry(GpacLogTool.MMIO, 1, 'MMIO error'),
          createLogEntry(GpacLogTool.MMIO, 3, 'MMIO info'),
        ],
      }),
    );

    // Set UI filter to ERROR only
    store.dispatch(setUIFilter({ levels: [GpacLogLevel.ERROR] }));

    // Should see errors from ALL tools (filter + mmio)
    const visibleLogs = selectVisibleLogs(store.getState());
    expect(visibleLogs).toHaveLength(2);
    expect(visibleLogs.some((log) => log.message === 'Filter error')).toBe(
      true,
    );
    expect(visibleLogs.some((log) => log.message === 'MMIO error')).toBe(true);
    expect(visibleLogs.some((log) => log.message === 'Filter warning')).toBe(
      false,
    );
    expect(visibleLogs.some((log) => log.message === 'MMIO info')).toBe(false);
  });

  it('should filter warnings across all tools', () => {
    const store = createTestStore();

    // Add logs
    store.dispatch(
      appendLogs({
        tool: GpacLogTool.NETWORK,
        logs: [
          createLogEntry(GpacLogTool.NETWORK, 1, 'Network error'),
          createLogEntry(GpacLogTool.NETWORK, 2, 'Network warning'),
          createLogEntry(GpacLogTool.NETWORK, 3, 'Network info'),
        ],
      }),
    );

    store.dispatch(
      appendLogs({
        tool: GpacLogTool.CODEC,
        logs: [
          createLogEntry(GpacLogTool.CODEC, 2, 'Codec warning'),
          createLogEntry(GpacLogTool.CODEC, 3, 'Codec info'),
        ],
      }),
    );

    // Set UI filter to WARNING only
    store.dispatch(setUIFilter({ levels: [GpacLogLevel.WARNING] }));

    // Should see only warnings from all tools
    const visibleLogs = selectVisibleLogs(store.getState());
    expect(visibleLogs).toHaveLength(2);
    expect(visibleLogs.every((log) => log.level === 2)).toBe(true);
  });

  it('should preserve config when using uiFilter (Layer 2 over Layer 1)', () => {
    const store = createTestStore();

    // Setup: filter@info, mmio@quiet (Layer 1 config)
    const initialConfig = store.getState().logs.levelsByTool;

    // Add logs
    store.dispatch(
      appendLogs({
        tool: GpacLogTool.FILTER,
        logs: [createLogEntry(GpacLogTool.FILTER, 1, 'Filter error')],
      }),
    );

    // Apply UI filter (Layer 2)
    store.dispatch(setUIFilter({ levels: [GpacLogLevel.ERROR] }));

    // Verify Layer 1 config unchanged
    expect(store.getState().logs.levelsByTool).toEqual(initialConfig);
  });

  it('should handle clearing filter correctly', () => {
    const store = createTestStore();

    // Add logs
    store.dispatch(
      appendLogs({
        tool: GpacLogTool.AUDIO,
        logs: [
          createLogEntry(GpacLogTool.AUDIO, 1, 'Audio error'),
          createLogEntry(GpacLogTool.AUDIO, 2, 'Audio warning'),
          createLogEntry(GpacLogTool.AUDIO, 3, 'Audio info'),
        ],
      }),
    );

    // Set filter
    store.dispatch(setUIFilter({ levels: [GpacLogLevel.ERROR] }));
    expect(selectVisibleLogs(store.getState())).toHaveLength(1);

    // Clear filter
    store.dispatch(clearUIFilter());

    // Should return to normal filtering (no uiFilter)
    expect(store.getState().logs.uiFilter).toBeNull();
    expect(selectViewMode(store.getState())).toBe('perTool');
  });
});
