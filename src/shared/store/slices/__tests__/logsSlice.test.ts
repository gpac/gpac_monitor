import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import logsReducer, {
  setTool,
  setDefaultAllLevel,
  appendLogs,
  setMaxEntriesPerTool,
} from '../logsSlice';
import { selectVisibleLogs } from '../../selectors/logsSelectors';
import {
  GpacLogTool,
  GpacLogLevel,
  GpacLogEntry,
} from '../../../../types/domain/gpac/log-types';
import graphReducer from '../graphSlice';
import widgetsReducer from '../widgetsSlice';
import filterArgumentReducer from '../filterArgumentSlice';
import sessionStatsReducer from '../sessionStatsSlice';

// Mock localStorage globally for all tests
let localStorageMock: { [key: string]: string };

beforeEach(() => {
  // Mock localStorage before each test
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

/** Create test store with all required reducers */
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

/** Create mock log entry */
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

describe('Logs History Preservation - Real Usage Scenarios', () => {
  it('preserves logs when switching between tools during active monitoring', () => {
    const store = createTestStore();

    // Set level to see all logs
    store.dispatch(setDefaultAllLevel(GpacLogLevel.DEBUG));

    // Simulate heavy mutex activity - 200 logs over time
    const mutexLogs = Array.from({ length: 200 }, (_, i) =>
      createLogEntry(
        GpacLogTool.MUTEX,
        3,
        `Mutex lock acquired by thread ${i % 8}`,
        Date.now() + i,
      ),
    );
    store.dispatch(appendLogs({ tool: GpacLogTool.MUTEX, logs: mutexLogs }));

    // User checks mutex logs
    store.dispatch(setTool(GpacLogTool.MUTEX));
    expect(selectVisibleLogs(store.getState())).toHaveLength(200);

    // Meanwhile, core system generates 300 logs
    const coreLogs = Array.from({ length: 300 }, (_, i) =>
      createLogEntry(
        GpacLogTool.CORE,
        3,
        `Filter pipeline step ${i}: processing frame`,
        Date.now() + i + 1000,
      ),
    );
    store.dispatch(appendLogs({ tool: GpacLogTool.CORE, logs: coreLogs }));

    // User switches to core to investigate
    store.dispatch(setTool(GpacLogTool.CORE));
    expect(selectVisibleLogs(store.getState())).toHaveLength(300);

    // More mutex activity happens while user on core
    const newMutexLogs = Array.from({ length: 150 }, (_, i) =>
      createLogEntry(
        GpacLogTool.MUTEX,
        2,
        `Warning: Lock contention detected ${i}`,
        Date.now() + i + 2000,
      ),
    );
    store.dispatch(appendLogs({ tool: GpacLogTool.MUTEX, logs: newMutexLogs }));

    // User returns to mutex - should see ALL 350 logs (200 + 150)
    store.dispatch(setTool(GpacLogTool.MUTEX));
    const finalMutexLogs = selectVisibleLogs(store.getState());
    expect(finalMutexLogs).toHaveLength(350);
    expect(finalMutexLogs.filter((log) => log.level === 2)).toHaveLength(150); // warnings
    expect(finalMutexLogs.filter((log) => log.level === 3)).toHaveLength(200); // info
  });

  it('preserves complete log history when adjusting verbosity levels', () => {
    const store = createTestStore();

    // Real GPAC session: mix of different log levels for network tool
    const networkLogs: GpacLogEntry[] = [
      ...Array.from({ length: 50 }, (_, i) =>
        createLogEntry(
          GpacLogTool.NETWORK,
          1,
          `Connection failed to server ${i % 5}`,
          Date.now() + i,
        ),
      ),
      ...Array.from({ length: 120 }, (_, i) =>
        createLogEntry(
          GpacLogTool.NETWORK,
          2,
          `Retry attempt ${i} for segment download`,
          Date.now() + i + 100,
        ),
      ),
      ...Array.from({ length: 500 }, (_, i) =>
        createLogEntry(
          GpacLogTool.NETWORK,
          3,
          `HTTP response 200 for chunk ${i}`,
          Date.now() + i + 200,
        ),
      ),
      ...Array.from({ length: 800 }, (_, i) =>
        createLogEntry(
          GpacLogTool.NETWORK,
          4,
          `Debug: TCP window size adjusted to ${1024 + i}`,
          Date.now() + i + 300,
        ),
      ),
    ];

    store.dispatch(
      appendLogs({ tool: GpacLogTool.NETWORK, logs: networkLogs }),
    );
    store.dispatch(setTool(GpacLogTool.NETWORK));

    // Start with DEBUG level - see everything (1470 logs)
    store.dispatch(setDefaultAllLevel(GpacLogLevel.DEBUG));
    expect(selectVisibleLogs(store.getState())).toHaveLength(1470);

    // User notices too verbose, switches to INFO - see errors + warnings + info (670 logs)
    store.dispatch(setDefaultAllLevel(GpacLogLevel.INFO));
    expect(selectVisibleLogs(store.getState())).toHaveLength(670);

    // More network activity during monitoring
    const realtimeLogs: GpacLogEntry[] = [
      ...Array.from({ length: 20 }, (_, i) =>
        createLogEntry(
          GpacLogTool.NETWORK,
          1,
          `Critical: Connection timeout ${i}`,
          Date.now() + i + 1000,
        ),
      ),
      ...Array.from({ length: 100 }, (_, i) =>
        createLogEntry(
          GpacLogTool.NETWORK,
          4,
          `Debug: Bandwidth measurement ${i}mbps`,
          Date.now() + i + 1100,
        ),
      ),
    ];
    store.dispatch(
      appendLogs({ tool: GpacLogTool.NETWORK, logs: realtimeLogs }),
    );

    // Still on INFO level - should see 690 logs (670 + 20 new errors, debug hidden)
    expect(selectVisibleLogs(store.getState())).toHaveLength(690);

    // Issue resolved, user increases verbosity to DEBUG again
    store.dispatch(setDefaultAllLevel(GpacLogLevel.DEBUG));
    const finalLogs = selectVisibleLogs(store.getState());

    // Should see ALL logs including the debug ones that were hidden (1590 total)
    expect(finalLogs).toHaveLength(1590);
    expect(finalLogs.filter((log) => log.level === 4)).toHaveLength(900); // all debug logs preserved
    expect(
      finalLogs.some((log) => log.message.includes('Bandwidth measurement')),
    ).toBe(true);
  });

  it('handles realistic FIFO buffer overflow while preserving visible history', () => {
    const store = createTestStore();

    // Set level to see all logs and smaller buffer for testing
    store.dispatch(setDefaultAllLevel(GpacLogLevel.DEBUG));
    store.dispatch(setMaxEntriesPerTool(1000));

    // Generate 1200 logs for HTTP tool (exceeds buffer)
    const httpLogs = Array.from({ length: 1200 }, (_, i) =>
      createLogEntry(
        GpacLogTool.HTTP,
        3,
        `Request ${i} to manifest.mpd`,
        Date.now() + i,
      ),
    );
    store.dispatch(appendLogs({ tool: GpacLogTool.HTTP, logs: httpLogs }));
    store.dispatch(setTool(GpacLogTool.HTTP));

    // Should keep only last 1000 logs (FIFO)
    const visibleLogs = selectVisibleLogs(store.getState());
    expect(visibleLogs).toHaveLength(1000);
    expect(visibleLogs[0].message).toBe('Request 200 to manifest.mpd');
    expect(visibleLogs[999].message).toBe('Request 1199 to manifest.mpd');

    // Switch to different tool and back - history still preserved
    store.dispatch(setTool(GpacLogTool.CORE));
    store.dispatch(setTool(GpacLogTool.HTTP));

    expect(selectVisibleLogs(store.getState())).toHaveLength(1000);
    expect(selectVisibleLogs(store.getState())[0].message).toBe(
      'Request 200 to manifest.mpd',
    );
  });

  it('maintains separate buffers per tool during concurrent logging', () => {
    const store = createTestStore();

    // Simulate concurrent activity across multiple tools
    store.dispatch(
      appendLogs({
        tool: GpacLogTool.DASH,
        logs: Array.from({ length: 100 }, (_, i) =>
          createLogEntry(GpacLogTool.DASH, 3, `Segment ${i} downloaded`),
        ),
      }),
    );

    store.dispatch(
      appendLogs({
        tool: GpacLogTool.AUDIO,
        logs: Array.from({ length: 80 }, (_, i) =>
          createLogEntry(GpacLogTool.AUDIO, 2, `Audio frame ${i} decoded`),
        ),
      }),
    );

    store.dispatch(
      appendLogs({
        tool: GpacLogTool.CODEC,
        logs: Array.from({ length: 60 }, (_, i) =>
          createLogEntry(GpacLogTool.CODEC, 3, `Codec buffer ${i} ready`),
        ),
      }),
    );

    // Set level to DEBUG to see all logs including level 4
    store.dispatch(setDefaultAllLevel(GpacLogLevel.DEBUG));

    // Check each tool independently
    store.dispatch(setTool(GpacLogTool.DASH));
    expect(selectVisibleLogs(store.getState())).toHaveLength(100);

    store.dispatch(setTool(GpacLogTool.AUDIO));
    expect(selectVisibleLogs(store.getState())).toHaveLength(80);

    store.dispatch(setTool(GpacLogTool.CODEC));
    expect(selectVisibleLogs(store.getState())).toHaveLength(60);

    // "all" tool should show combined sorted logs
    store.dispatch(setTool(GpacLogTool.ALL));
    expect(selectVisibleLogs(store.getState())).toHaveLength(240);
  });
});
