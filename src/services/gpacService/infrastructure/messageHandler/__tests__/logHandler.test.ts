import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LogHandler } from '../logHandler';
import type { MessageHandlerDependencies } from '../types';
import type {
  GpacLogEntry,
  LogManagerStatus,
} from '@/types/domain/gpac/log-types';

// LogHandler.subscribeToLogEntries touches the real logWorkerService singleton,
// which imports a `?worker&inline` module — irrelevant to this handler's own
// contract (already covered by src/workers/__tests__/logWorker.test.ts) and
// unreliable to construct in jsdom, so it's mocked out entirely.
vi.mock('@/services/workers/logWorkerService', () => ({
  logWorkerService: {
    subscribe: vi.fn(() => () => {}),
    cleanup: vi.fn(),
  },
}));

function makeDependencies(): MessageHandlerDependencies {
  return {
    isConnected: vi.fn(() => true),
    send: vi.fn().mockResolvedValue(undefined),
    stopReconnection: vi.fn(),
    markEndOfSession: vi.fn(),
  };
}

describe('LogHandler', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('subscribeToLogs sends a subscribe_logs message and notifies onLogSubscriptionChange', async () => {
    const dependencies = makeDependencies();
    const onLogSubscriptionChange = vi.fn();
    const handler = new LogHandler(dependencies, () => true, {
      onLogSubscriptionChange,
    } as any);

    await handler.subscribeToLogs('all@warning');

    expect(dependencies.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'subscribe_logs',
        logLevel: 'all@warning',
      }),
    );
    expect(onLogSubscriptionChange).toHaveBeenCalledWith(true);
  });

  it('unsubscribeFromLogs sends an unsubscribe_logs message and notifies onLogSubscriptionChange', async () => {
    const dependencies = makeDependencies();
    const onLogSubscriptionChange = vi.fn();
    const handler = new LogHandler(dependencies, () => true, {
      onLogSubscriptionChange,
    } as any);
    await handler.subscribeToLogs('all@warning');
    (dependencies.send as any).mockClear();
    onLogSubscriptionChange.mockClear();

    await handler.unsubscribeFromLogs();

    expect(dependencies.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'unsubscribe_logs' }),
    );
    expect(onLogSubscriptionChange).toHaveBeenCalledWith(false);
  });

  it('handleLogBatch forwards the batch to onLogsUpdate untouched', () => {
    const dependencies = makeDependencies();
    const onLogsUpdate = vi.fn();
    const handler = new LogHandler(dependencies, () => true, {
      onLogsUpdate,
    } as any);
    const logs: GpacLogEntry[] = [
      { timestamp: 1000, tool: 'core', level: 2, message: 'hi' },
    ];

    handler.handleLogBatch(logs);

    expect(onLogsUpdate).toHaveBeenCalledWith(logs);
  });

  it('handleLogConfigChanged merges the new logLevel into the tracked log status', () => {
    const dependencies = makeDependencies();
    const handler = new LogHandler(dependencies, () => true);
    const initialStatus: LogManagerStatus = {
      isSubscribed: true,
      logLevel: 'all@info',
      logCount: 0,
      currentLogConfig: 'all@info',
    };
    handler.handleLogStatus(initialStatus);

    handler.handleLogConfigChanged('all@debug');

    // No public getter exists for the tracked status; reaching into the
    // subscribable mirrors the pattern already used in historyController tests.
    const status = (handler as any).logStatusSubscribable.getSnapshot();
    expect(status).toEqual({ ...initialStatus, logLevel: 'all@debug' });
  });

  it('schedules unsubscribe 100ms after the last subscribeToLogEntries cleanup, and re-subscribing within the window cancels it', async () => {
    vi.useFakeTimers();
    const dependencies = makeDependencies();
    const handler = new LogHandler(dependencies, () => true);
    const callback = vi.fn();

    const unsubscribe = handler.subscribeToLogEntries(callback);
    (dependencies.send as any).mockClear();
    unsubscribe();

    // Re-subscribing before the 100ms window elapses must cancel the pending auto-unsubscribe.
    const unsubscribe2 = handler.subscribeToLogEntries(callback);
    await vi.advanceTimersByTimeAsync(150);
    expect(dependencies.send).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'unsubscribe_logs' }),
    );

    unsubscribe2();
    await vi.advanceTimersByTimeAsync(150);
    expect(dependencies.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'unsubscribe_logs' }),
    );
  });

  describe('cleanup', () => {
    it('clears pending auto-unsubscribe timers and stops further notifications', async () => {
      vi.useFakeTimers();
      const dependencies = makeDependencies();
      const handler = new LogHandler(dependencies, () => true);
      const callback = vi.fn();

      const unsubscribe = handler.subscribeToLogEntries(callback);
      (dependencies.send as any).mockClear();
      unsubscribe();

      handler.cleanup();
      await vi.advanceTimersByTimeAsync(200);

      expect(dependencies.send).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'unsubscribe_logs' }),
      );
    });
  });
});
