import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MonitoredFilterStats } from '@/types/domain/gpac/model';
import { useFilterStatsLive } from '../useFilterStatsLive';

const service = vi.hoisted(() => ({
  isConnected: vi.fn(() => true),
  subscribe: vi.fn(),
}));
vi.mock('@/services/gpacService', () => ({ gpacService: service }));

const createStats = (filterIdx: number): MonitoredFilterStats => ({
  idx: filterIdx,
  status: '',
  bytes_done: 0,
  bytes_sent: 0,
  pck_sent: 0,
  pck_done: 0,
  time: 0,
  nb_ipid: 0,
  nb_opid: 0,
});

beforeEach(() => {
  service.subscribe.mockReset();
  service.isConnected.mockReturnValue(true);
});

describe('filter stats subscription lifecycle during replacement', () => {
  it('releases the old subscription, ignores late updates and cleans up on panel removal', async () => {
    const callbacks = new Map<
      number,
      (result: { data: MonitoredFilterStats }) => void
    >();
    const cleanupPrevious = vi.fn();
    const cleanupNext = vi.fn();
    service.subscribe.mockImplementation(async (config, callback) => {
      callbacks.set(config.filterIdx, callback);
      return config.filterIdx === 3 ? cleanupPrevious : cleanupNext;
    });
    const { result, rerender, unmount } = renderHook(
      ({ filterIdx }) => useFilterStatsLive(filterIdx),
      { initialProps: { filterIdx: 3 } },
    );
    await waitFor(() => expect(service.subscribe).toHaveBeenCalledTimes(1));
    act(() => callbacks.get(3)!({ data: createStats(3) }));
    expect(result.current.stats?.idx).toBe(3);
    rerender({ filterIdx: 7 });
    await waitFor(() => expect(service.subscribe).toHaveBeenCalledTimes(2));
    expect(cleanupPrevious).toHaveBeenCalledTimes(1);
    expect(result.current.stats).toBeNull();
    act(() => callbacks.get(3)!({ data: createStats(3) }));
    expect(result.current.stats).toBeNull();
    act(() => callbacks.get(7)!({ data: createStats(7) }));
    expect(result.current.stats?.idx).toBe(7);
    unmount();
    expect(cleanupNext).toHaveBeenCalledTimes(1);
  });

  it('cleans a subscription that resolves after switching filter or removing the panel', async () => {
    let resolvePrevious!: (cleanup: () => void) => void;
    let resolveNext!: (cleanup: () => void) => void;
    service.subscribe
      .mockReturnValueOnce(
        new Promise<() => void>((resolve) => {
          resolvePrevious = resolve;
        }),
      )
      .mockReturnValueOnce(
        new Promise<() => void>((resolve) => {
          resolveNext = resolve;
        }),
      );
    const cleanupPrevious = vi.fn();
    const cleanupNext = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ filterIdx }) => useFilterStatsLive(filterIdx),
      { initialProps: { filterIdx: 3 } },
    );
    rerender({ filterIdx: 7 });
    await act(async () => {
      resolvePrevious(cleanupPrevious);
    });
    expect(cleanupPrevious).toHaveBeenCalledTimes(1);
    unmount();
    await act(async () => {
      resolveNext(cleanupNext);
    });
    expect(cleanupNext).toHaveBeenCalledTimes(1);
  });
});
