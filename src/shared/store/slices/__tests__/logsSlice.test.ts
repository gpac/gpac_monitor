import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import logsReducer, {
  setTool,
  setDefaultAllLevel,
  setToolLevel,
  appendLogs,
  setMaxEntriesPerTool,
  markConfigAsSent,
} from '../logsSlice';
import { selectVisibleLogs } from '../../selectors/logsFilterSelectors';
import { selectLogsConfigChanges } from '../../selectors/logsConfigSelectors';
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

    // Verify buffers are maintained separately
    const state = store.getState();
    expect(state.logs.buffers[GpacLogTool.DASH]).toHaveLength(100);
    expect(state.logs.buffers[GpacLogTool.AUDIO]).toHaveLength(80);
    expect(state.logs.buffers[GpacLogTool.CODEC]).toHaveLength(60);
  });
});

describe('Configuration Change Detection - lastSentConfig', () => {
  it('should detect initial configuration changes from empty state', () => {
    const store = createTestStore();

    // Initial state - no config sent yet
    expect(selectLogsConfigChanges(store.getState())).toBe('all@quiet');

    // Change default level
    store.dispatch(setDefaultAllLevel(GpacLogLevel.INFO));
    expect(selectLogsConfigChanges(store.getState())).toBe('all@info');

    // Add tool-specific level
    store.dispatch(
      setToolLevel({ tool: GpacLogTool.CORE, level: GpacLogLevel.DEBUG }),
    );
    expect(selectLogsConfigChanges(store.getState())).toBe(
      'all@info:core@debug',
    );
  });

  it('should only return changes after markConfigAsSent', () => {
    const store = createTestStore();

    // Set initial configuration
    store.dispatch(setDefaultAllLevel(GpacLogLevel.WARNING));
    store.dispatch(
      setToolLevel({ tool: GpacLogTool.HTTP, level: GpacLogLevel.INFO }),
    );
    store.dispatch(
      setToolLevel({ tool: GpacLogTool.DASH, level: GpacLogLevel.DEBUG }),
    );

    // Initial config changes
    expect(selectLogsConfigChanges(store.getState())).toBe(
      'all@warning:http@info:dash@debug',
    );

    // Mark as sent
    store.dispatch(markConfigAsSent());

    // Now should return empty (no changes)
    expect(selectLogsConfigChanges(store.getState())).toBe('');

    // Make new change
    store.dispatch(
      setToolLevel({ tool: GpacLogTool.CODEC, level: GpacLogLevel.ERROR }),
    );
    expect(selectLogsConfigChanges(store.getState())).toBe('codec@error');

    // Make another change
    store.dispatch(setDefaultAllLevel(GpacLogLevel.INFO));
    expect(selectLogsConfigChanges(store.getState())).toBe(
      'all@info:codec@error',
    );
  });

  it('should detect tool level modifications after marking as sent', () => {
    const store = createTestStore();

    // Initial setup
    store.dispatch(setDefaultAllLevel(GpacLogLevel.WARNING));
    store.dispatch(
      setToolLevel({ tool: GpacLogTool.NETWORK, level: GpacLogLevel.INFO }),
    );
    store.dispatch(markConfigAsSent());

    // Modify existing tool level
    store.dispatch(
      setToolLevel({ tool: GpacLogTool.NETWORK, level: GpacLogLevel.DEBUG }),
    );
    expect(selectLogsConfigChanges(store.getState())).toBe('network@debug');

    // Mark as sent and modify again
    store.dispatch(markConfigAsSent());
    store.dispatch(
      setToolLevel({ tool: GpacLogTool.NETWORK, level: GpacLogLevel.ERROR }),
    );
    expect(selectLogsConfigChanges(store.getState())).toBe('network@error');
  });

  it('should handle multiple concurrent changes efficiently', () => {
    const store = createTestStore();

    // Initial state
    store.dispatch(setDefaultAllLevel(GpacLogLevel.ERROR));
    store.dispatch(markConfigAsSent());

    // Batch of changes
    store.dispatch(setDefaultAllLevel(GpacLogLevel.INFO));
    store.dispatch(
      setToolLevel({ tool: GpacLogTool.FILTER, level: GpacLogLevel.DEBUG }),
    );
    store.dispatch(
      setToolLevel({ tool: GpacLogTool.MEM, level: GpacLogLevel.WARNING }),
    );
    store.dispatch(
      setToolLevel({ tool: GpacLogTool.RTP, level: GpacLogLevel.ERROR }),
    );

    // Should detect all changes in one go
    const changes = selectLogsConfigChanges(store.getState());
    expect(changes).toContain('all@info');
    expect(changes).toContain('filter@debug');
    expect(changes).toContain('memory@warning');
    expect(changes).toContain('rtp@error');

    // Mark as sent and verify reset
    store.dispatch(markConfigAsSent());
    expect(selectLogsConfigChanges(store.getState())).toBe('');
  });

  it('should preserve lastSentConfig state correctly after markConfigAsSent', () => {
    const store = createTestStore();

    // Set configuration
    store.dispatch(setDefaultAllLevel(GpacLogLevel.DEBUG));
    store.dispatch(
      setToolLevel({ tool: GpacLogTool.SCENE, level: GpacLogLevel.WARNING }),
    );

    // Mark as sent
    store.dispatch(markConfigAsSent());

    // Verify lastSentConfig matches current config
    const state = store.getState();
    expect(state.logs.lastSentConfig.defaultAllLevel).toBe(GpacLogLevel.DEBUG);
    expect(state.logs.lastSentConfig.levelsByTool[GpacLogTool.SCENE]).toBe(
      GpacLogLevel.WARNING,
    );

    // Make minimal change
    store.dispatch(
      setToolLevel({ tool: GpacLogTool.PARSER, level: GpacLogLevel.INFO }),
    );

    // Should only show the new change
    expect(selectLogsConfigChanges(store.getState())).toBe('parser@info');

    // The previous config should remain in lastSentConfig
    const newState = store.getState();
    expect(newState.logs.lastSentConfig.defaultAllLevel).toBe(
      GpacLogLevel.DEBUG,
    );
    expect(newState.logs.lastSentConfig.levelsByTool[GpacLogTool.SCENE]).toBe(
      GpacLogLevel.WARNING,
    );
  });
});

describe('Log Persistence During Tool/Level Configuration Changes', () => {
  it('preserves filter@info logs when switching to codec@warning and mutex@info then back', () => {
    const store = createTestStore();

    // Initial configuration: filter@info and all@quiet
    store.dispatch(setDefaultAllLevel(GpacLogLevel.QUIET));
    store.dispatch(
      setToolLevel({ tool: GpacLogTool.FILTER, level: GpacLogLevel.INFO }),
    );
    store.dispatch(setTool(GpacLogTool.FILTER));

    // Add 2 error logs on filter (visible with filter@info)
    const filterErrorLogs: GpacLogEntry[] = [
      createLogEntry(
        GpacLogTool.FILTER,
        1,
        'Critical filter error #1',
        Date.now(),
      ),
      createLogEntry(
        GpacLogTool.FILTER,
        1,
        'Critical filter error #2',
        Date.now() + 100,
      ),
    ];
    store.dispatch(
      appendLogs({ tool: GpacLogTool.FILTER, logs: filterErrorLogs }),
    );

    // Verify that the 2 errors are visible on filter@info
    expect(selectVisibleLogs(store.getState())).toHaveLength(2);
    expect(selectVisibleLogs(store.getState())[0].message).toBe(
      'Critical filter error #1',
    );
    expect(selectVisibleLogs(store.getState())[1].message).toBe(
      'Critical filter error #2',
    );

    // Change configuration to codec@warning and mutex@info
    store.dispatch(
      setToolLevel({ tool: GpacLogTool.CODEC, level: GpacLogLevel.WARNING }),
    );
    store.dispatch(
      setToolLevel({ tool: GpacLogTool.MUTEX, level: GpacLogLevel.INFO }),
    );

    // Switch to codec@warning
    store.dispatch(setTool(GpacLogTool.CODEC));

    // Add some logs on codec
    const codecLogs: GpacLogEntry[] = [
      createLogEntry(
        GpacLogTool.CODEC,
        2,
        'Codec warning #1',
        Date.now() + 200,
      ),
      createLogEntry(GpacLogTool.CODEC, 1, 'Codec error #1', Date.now() + 300),
    ];
    store.dispatch(appendLogs({ tool: GpacLogTool.CODEC, logs: codecLogs }));
    expect(selectVisibleLogs(store.getState())).toHaveLength(2);

    // Switch to mutex@info
    store.dispatch(setTool(GpacLogTool.MUTEX));

    // Add some logs on mutex
    const mutexLogs: GpacLogEntry[] = [
      createLogEntry(GpacLogTool.MUTEX, 3, 'Mutex info #1', Date.now() + 400),
      createLogEntry(
        GpacLogTool.MUTEX,
        2,
        'Mutex warning #1',
        Date.now() + 500,
      ),
      createLogEntry(GpacLogTool.MUTEX, 1, 'Mutex error #1', Date.now() + 600),
    ];
    store.dispatch(appendLogs({ tool: GpacLogTool.MUTEX, logs: mutexLogs }));
    expect(selectVisibleLogs(store.getState())).toHaveLength(3);

    // CRITICAL POINT: Switch back to filter@info
    store.dispatch(setTool(GpacLogTool.FILTER));

    // VERIFICATION: The 2 filter error logs must still be present
    const finalFilterLogs = selectVisibleLogs(store.getState());
    expect(finalFilterLogs).toHaveLength(2);
    expect(finalFilterLogs[0].message).toBe('Critical filter error #1');
    expect(finalFilterLogs[1].message).toBe('Critical filter error #2');
    expect(
      finalFilterLogs.every((log) => log.tool === GpacLogTool.FILTER),
    ).toBe(true);
    expect(finalFilterLogs.every((log) => log.level === 1)).toBe(true); // errors
  });

  it('preserves logs when changing currentTool without backend calls', () => {
    const store = createTestStore();

    // Configuration: all@warning
    store.dispatch(setDefaultAllLevel(GpacLogLevel.WARNING));

    // Add logs on different tools
    store.dispatch(
      appendLogs({
        tool: GpacLogTool.NETWORK,
        logs: [
          createLogEntry(GpacLogTool.NETWORK, 1, 'Network error', Date.now()),
          createLogEntry(
            GpacLogTool.NETWORK,
            2,
            'Network warning',
            Date.now() + 100,
          ),
          createLogEntry(
            GpacLogTool.NETWORK,
            3,
            'Network info (hidden)',
            Date.now() + 200,
          ),
        ],
      }),
    );

    store.dispatch(
      appendLogs({
        tool: GpacLogTool.AUDIO,
        logs: [
          createLogEntry(GpacLogTool.AUDIO, 1, 'Audio error', Date.now() + 300),
          createLogEntry(
            GpacLogTool.AUDIO,
            2,
            'Audio warning',
            Date.now() + 400,
          ),
        ],
      }),
    );

    // Start on network
    store.dispatch(setTool(GpacLogTool.NETWORK));
    expect(selectVisibleLogs(store.getState())).toHaveLength(2); // error + warning (info hidden)

    // Switch to audio
    store.dispatch(setTool(GpacLogTool.AUDIO));
    expect(selectVisibleLogs(store.getState())).toHaveLength(2); // error + warning

    // Return to network - logs must be preserved
    store.dispatch(setTool(GpacLogTool.NETWORK));
    const networkLogs = selectVisibleLogs(store.getState());
    expect(networkLogs).toHaveLength(2);
    expect(networkLogs[0].message).toBe('Network error');
    expect(networkLogs[1].message).toBe('Network warning');
  });
});
