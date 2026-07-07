import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LogProcessor, LogWorkerResponse } from '../logWorker';
import { GpacLogEntry } from '@/types/domain/gpac/log-types';

const BATCH_SIZE = 500;
const FLUSH_INTERVAL = 200;
const MAX_BUFFER_SIZE = 5000;

function makeLogs(count: number, startIndex = 0): GpacLogEntry[] {
  return Array.from({ length: count }, (_, offset) => ({
    timestamp: startIndex + offset,
    tool: 'core',
    level: 1,
    message: `log-${startIndex + offset}`,
  }));
}

describe('LogProcessor', () => {
  let postMessageMock: ReturnType<typeof vi.fn>;
  let processor: LogProcessor;

  function sentLogs(): GpacLogEntry[] {
    return postMessageMock.mock.calls.flatMap(
      ([response]: [LogWorkerResponse]) => response.logs,
    );
  }

  beforeEach(() => {
    vi.useFakeTimers();
    postMessageMock = vi.fn();
    vi.stubGlobal('postMessage', postMessageMock);
    processor = new LogProcessor();
  });

  afterEach(() => {
    processor.cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('delivers all buffered logs through rescheduled flushes without an external interval', () => {
    processor.addLogs(makeLogs(1200));

    expect(postMessageMock).toHaveBeenCalledTimes(1);
    expect(sentLogs()).toHaveLength(BATCH_SIZE);

    vi.advanceTimersByTime(FLUSH_INTERVAL);
    expect(sentLogs()).toHaveLength(2 * BATCH_SIZE);

    vi.advanceTimersByTime(FLUSH_INTERVAL);
    expect(sentLogs()).toHaveLength(1200);
  });

  it('flushes small batches after the flush interval instead of dropping them', () => {
    processor.addLogs(makeLogs(10));

    expect(postMessageMock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(FLUSH_INTERVAL);

    expect(sentLogs()).toHaveLength(10);
  });

  it('keeps the most recent logs when the buffer overflows instead of rejecting incoming logs', () => {
    processor.addLogs(makeLogs(6000));

    vi.advanceTimersByTime(FLUSH_INTERVAL * 20);

    const delivered = sentLogs();
    expect(delivered).toHaveLength(MAX_BUFFER_SIZE);
    expect(delivered[0].timestamp).toBe(1000);
    expect(delivered[delivered.length - 1].timestamp).toBe(5999);
  });
});
