import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type {
  FilterStatsWorkerMessage,
  FilterStatsWorkerResponse,
} from '../filterStatsWorker';
import type { MonitoredFilterStats } from '@/types/domain/gpac';

const BATCH_SIZE = 50;
const FLUSH_INTERVAL = 300;
const MAX_BUFFER_PER_FILTER = 10;

function makeStats(
  idx: number,
  overrides: Partial<MonitoredFilterStats> = {},
): MonitoredFilterStats {
  return {
    idx,
    status: '',
    bytes_done: 0,
    bytes_sent: 0,
    pck_sent: 0,
    pck_done: 0,
    time: 0,
    nb_ipid: 0,
    nb_opid: 0,
    ...overrides,
  };
}

describe('filterStatsWorker', () => {
  let postMessageMock: ReturnType<typeof vi.fn>;
  // FilterStatsProcessor isn't exported (unlike LogProcessor in logWorker.ts) —
  // captured directly from self.addEventListener('message', ...) instead of
  // self.dispatchEvent(), which would accumulate listeners across re-imports
  // (vi.resetModules() clears the module cache, not the global listener registry).
  let messageHandler: (event: { data: FilterStatsWorkerMessage }) => void;

  function sentBatches(): FilterStatsWorkerResponse[] {
    return postMessageMock.mock.calls.map(([response]) => response);
  }

  function postToWorker(message: FilterStatsWorkerMessage): void {
    messageHandler({ data: message });
  }

  beforeEach(async () => {
    vi.useFakeTimers();
    postMessageMock = vi.fn();
    vi.stubGlobal('postMessage', postMessageMock);
    vi.stubGlobal(
      'addEventListener',
      (
        type: string,
        handler: (event: { data: FilterStatsWorkerMessage }) => void,
      ) => {
        if (type === 'message') messageHandler = handler;
      },
    );
    vi.resetModules();
    await import('../filterStatsWorker');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('flushes once BATCH_SIZE stats have accumulated across filters', () => {
    for (let i = 0; i < BATCH_SIZE; i++) {
      postToWorker({ type: 'PROCESS_FILTER_STATS', stats: makeStats(i % 5) });
    }

    expect(postMessageMock).toHaveBeenCalledTimes(1);
    expect(sentBatches()[0].count).toBe(BATCH_SIZE);
  });

  it('flushes a small buffer after FLUSH_INTERVAL instead of dropping it', () => {
    postToWorker({ type: 'PROCESS_FILTER_STATS', stats: makeStats(1) });
    expect(postMessageMock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(FLUSH_INTERVAL);

    expect(postMessageMock).toHaveBeenCalledTimes(1);
    expect(sentBatches()[0].count).toBe(1);
  });

  it('keeps only the most recent MAX_BUFFER_PER_FILTER stats per filter idx (circuit breaker)', () => {
    for (let i = 0; i < MAX_BUFFER_PER_FILTER + 5; i++) {
      postToWorker({
        type: 'PROCESS_FILTER_STATS',
        stats: makeStats(1, { time: i }),
      });
    }
    vi.advanceTimersByTime(FLUSH_INTERVAL);

    const [response] = sentBatches();
    expect(response.statsBatch).toHaveLength(MAX_BUFFER_PER_FILTER);
    expect(response.statsBatch[0].time).toBe(5);
    expect(response.statsBatch[response.statsBatch.length - 1].time).toBe(14);
  });

  it('CLEANUP stops the periodic flush timer without sending a final batch', () => {
    postToWorker({ type: 'PROCESS_FILTER_STATS', stats: makeStats(1) });
    postToWorker({ type: 'CLEANUP' });

    vi.advanceTimersByTime(FLUSH_INTERVAL * 5);

    expect(postMessageMock).not.toHaveBeenCalled();
  });
});
