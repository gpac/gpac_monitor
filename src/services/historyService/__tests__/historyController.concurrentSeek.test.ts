import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HistoryController } from '../historyController';
import type { HistorySource, HistoryManifest } from '../source/types';
import type { HistorySnapshot, LogEvent } from '../types';

const snapshot: HistorySnapshot = {
  ts_us: 0,
  command_line: null,
  graph_v: 1,
  filters: [],
};

const twoChunks: HistoryManifest = {
  version: 1,
  startUs: 0,
  endUs: 20_000_000,
  chunkDurationUs: 10_000_000,
  chunkCount: 2,
  logChunks: [
    { file: 'logs/logs_0000.jsonl', fromUs: 1_000_000, toUs: 3_000_000, count: 1 },
    { file: 'logs/logs_0001.jsonl', fromUs: 11_000_000, toUs: 13_000_000, count: 1 },
  ],
};

const LOG_TS_BY_CHUNK = [2_000_000, 12_000_000];

const makeLogEvent = (tsUs: number): LogEvent => ({
  message: 'log_batch',
  ts_us: tsUs,
  logs: [
    {
      timestamp: tsUs,
      tool: 'core',
      level: 1,
      message: `line at ${tsUs}`,
      thread_id: -1,
      caller: null,
    },
  ],
});

/** Holds back the first read of `delayedLogIndex` until `release()` is called. */
function makeSourceWithDelayedLogs(delayedLogIndex: number) {
  let release: () => void = () => {};
  const delayedRead = new Promise<LogEvent[]>((resolve) => {
    release = () => resolve([makeLogEvent(LOG_TS_BY_CHUNK[delayedLogIndex])]);
  });
  let delayedReadServed = false;
  const readLogChunk = vi.fn((index: number) => {
    if (index === delayedLogIndex && !delayedReadServed) {
      delayedReadServed = true;
      return delayedRead;
    }
    return Promise.resolve([makeLogEvent(LOG_TS_BY_CHUNK[index])]);
  });
  const source: HistorySource = {
    sessionId: 'test-session',
    getManifest: vi.fn().mockResolvedValue(twoChunks),
    loadSnapshot: vi.fn().mockResolvedValue(snapshot),
    loadJournalIndex: vi.fn().mockResolvedValue(null),
    getSessionIndex: vi.fn().mockResolvedValue(null),
    getSegmentManifest: vi.fn(),
    loadSegmentSnapshot: vi.fn(),
    loadGlobalEventsIndex: vi.fn().mockResolvedValue(null),
    readChunk: vi.fn().mockResolvedValue([]),
    readLogChunk,
    readCheckpoint: vi.fn().mockResolvedValue(null),
  };
  return { source, readLogChunk, release: () => release() };
}

describe('HistoryController.seek — the latest seek wins over late logs', () => {
  beforeEach(() => {
    vi.spyOn(performance, 'now').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    { label: 'forward', seekAUs: 2_000_000, seekBUs: 12_000_000, delayedLogIndex: 0 },
    { label: 'backward', seekAUs: 12_000_000, seekBUs: 2_000_000, delayedLogIndex: 1 },
  ])(
    '$label: logs of A arriving after B leave position and logs on B',
    async ({ seekAUs, seekBUs, delayedLogIndex }) => {
      const controller = new HistoryController();
      const { source, readLogChunk, release } =
        makeSourceWithDelayedLogs(delayedLogIndex);
      await controller.load(source, vi.fn());
      const hydrateLogsSpy = vi.spyOn(
        (controller as any).adapter,
        'hydrateLogsForSeek',
      );

      const seekA = controller.seek(seekAUs);
      await vi.waitFor(() =>
        expect(readLogChunk).toHaveBeenCalledWith(delayedLogIndex, undefined),
      );
      await controller.seek(seekBUs);
      release();
      await seekA;

      const lastPublishedLogs = hydrateLogsSpy.mock.lastCall?.[0] as LogEvent[];
      expect(lastPublishedLogs.map((log) => log.ts_us)).toEqual([seekBUs]);
      expect((controller as any).player.currentTimeUs()).toBe(seekBUs);
    },
  );
});
