import { describe, it, expect, vi, afterEach } from 'vitest';
import { FilterStatsHandler } from '../filterStatsHandler';
import type { MessageHandlerDependencies } from '../types';
import type { MonitoredFilterStats } from '@/types/domain/gpac';

function makeDependencies(): MessageHandlerDependencies {
  return {
    isConnected: vi.fn(() => true),
    send: vi.fn().mockResolvedValue(undefined),
    stopReconnection: vi.fn(),
    markEndOfSession: vi.fn(),
  };
}

const makeFilterStats = (
  idx: number,
  overrides: Partial<MonitoredFilterStats> = {},
): MonitoredFilterStats => ({
  idx,
  status: '',
  bytes_done: 0,
  bytes_sent: 0,
  pck_sent: 0,
  pck_done: 0,
  time: 0,
  nb_ipid: 1,
  nb_opid: 0,
  ...overrides,
});

describe('FilterStatsHandler', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('subscribeToFilterStats sends subscribe_filter with the idx', async () => {
    const dependencies = makeDependencies();
    const handler = new FilterStatsHandler(dependencies, () => true);

    await handler.subscribeToFilterStats(3);

    expect(dependencies.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'subscribe_filter', idx: 3 }),
    );
  });

  it('unsubscribeFromFilterStats sends unsubscribe_filter with the idx', async () => {
    const dependencies = makeDependencies();
    const handler = new FilterStatsHandler(dependencies, () => true);

    await handler.unsubscribeFromFilterStats(3);

    expect(dependencies.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'unsubscribe_filter', idx: 3 }),
    );
  });

  it('handleFilterStatsUpdate hydrates ipid fields from properties and notifies only the matching idx subscriber', async () => {
    vi.useFakeTimers();
    const dependencies = makeDependencies();
    const handler = new FilterStatsHandler(dependencies, () => true);

    const callback3 = vi.fn();
    const callback7 = vi.fn();
    handler.subscribeToFilterStatsUpdates(3, callback3);
    handler.subscribeToFilterStatsUpdates(7, callback7);

    const stats = makeFilterStats(3, {
      ipids: {
        pid_in: {
          name: 'pid_in',
          properties: { CodecID: { value: 'avc1' } },
        } as any,
      },
    });

    handler.handleFilterStatsUpdate(stats);
    // Subscribable.notify() always fires through a debounced setTimeout (150ms default).
    await vi.advanceTimersByTimeAsync(200);

    expect(callback3).toHaveBeenCalledTimes(1);
    expect(callback3.mock.calls[0][0].ipids.pid_in.codec).toBe('avc1');
    expect(callback7).not.toHaveBeenCalled();
  });

  it('preserves previously hydrated properties when a later update omits them for the same PID', async () => {
    vi.useFakeTimers();
    const dependencies = makeDependencies();
    const handler = new FilterStatsHandler(dependencies, () => true);
    const callback = vi.fn();
    handler.subscribeToFilterStatsUpdates(3, callback);

    handler.handleFilterStatsUpdate(
      makeFilterStats(3, {
        ipids: {
          pid_in: {
            name: 'pid_in',
            properties: { CodecID: { value: 'avc1' } },
          } as any,
        },
      }),
    );
    await vi.advanceTimersByTimeAsync(200);

    // Clear the 500ms MessageThrottler window (FILTER_STATS_THROTTLE_MS) so
    // this second update fires on the throttler's synchronous leading edge
    // too — keeping this test about property preservation, not throttle timing.
    await vi.advanceTimersByTimeAsync(500);
    handler.handleFilterStatsUpdate(
      makeFilterStats(3, {
        ipids: { pid_in: { name: 'pid_in' } as any },
      }),
    );
    await vi.advanceTimersByTimeAsync(200);

    expect(callback).toHaveBeenCalledTimes(2);
    expect(
      callback.mock.calls[1][0].ipids.pid_in.properties.CodecID.value,
    ).toBe('avc1');
  });

  it('schedules unsubscribe 100ms after the last subscriber for an idx unsubscribes, and cancels it on re-subscribe', async () => {
    vi.useFakeTimers();
    const dependencies = makeDependencies();
    const handler = new FilterStatsHandler(dependencies, () => true);
    const callback = vi.fn();

    const unsubscribe = handler.subscribeToFilterStatsUpdates(3, callback);
    (dependencies.send as any).mockClear();
    unsubscribe();

    const unsubscribe2 = handler.subscribeToFilterStatsUpdates(3, callback);
    await vi.advanceTimersByTimeAsync(150);
    expect(dependencies.send).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'unsubscribe_filter' }),
    );

    unsubscribe2();
    await vi.advanceTimersByTimeAsync(150);
    expect(dependencies.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'unsubscribe_filter', idx: 3 }),
    );
  });

  describe('cleanup', () => {
    it('clears pending auto-unsubscribe timers', async () => {
      vi.useFakeTimers();
      const dependencies = makeDependencies();
      const handler = new FilterStatsHandler(dependencies, () => true);
      const callback = vi.fn();

      const unsubscribe = handler.subscribeToFilterStatsUpdates(3, callback);
      (dependencies.send as any).mockClear();
      unsubscribe();

      handler.cleanup();
      await vi.advanceTimersByTimeAsync(200);

      expect(dependencies.send).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'unsubscribe_filter' }),
      );
    });
  });
});
