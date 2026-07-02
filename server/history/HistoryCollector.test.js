import { describe, it, expect, vi } from 'vitest';
import { HistoryCollector } from './HistoryCollector.js';

function makeCollector() {
  const collector = new HistoryCollector('test-history');
  collector.writer.writeLog = vi.fn();
  collector.writer.recordJournalFact = vi.fn();
  collector.writer.getCurrentLogChunkIndex = vi.fn(() => 0);
  return collector;
}

describe('HistoryCollector flushLogs', () => {
  it('records an error fact using the log line\'s own timestamp, not the flush-time clock', () => {
    const collector = makeCollector();

    // real bug report line: batch flushed at ts_us=1533744, but this line
    // was actually captured at timestamp=1523463
    collector.pendingLogs = [
      { timestamp: 1523463, tool: 'core', level: 1, message: 'Unsupported audio format 0', thread_id: -680877248, caller: null },
    ];

    collector.flushLogs();

    expect(collector.writer.recordJournalFact).toHaveBeenCalledWith(1523463, 1, 1, 0, expect.any(Number), 0);
  });

  it('records each error/warning individually when a batch holds several, no aggregation', () => {
    const collector = makeCollector();

    // same batch as the real bug report: two errors (level 1) + one warning (level 2)
    collector.pendingLogs = [
      { timestamp: 1523463, tool: 'core', level: 1, message: 'Unsupported audio format 0', thread_id: -680877248, caller: null },
      { timestamp: 1523478, tool: 'core', level: 2, message: 'Unsupported cicp audio layout for channel layout 0', thread_id: -680877248, caller: null },
      { timestamp: 1527685, tool: 'core', level: 1, message: 'Unsupported audio format 0', thread_id: -680877248, caller: null },
    ];

    collector.flushLogs();

    expect(collector.writer.recordJournalFact).toHaveBeenCalledTimes(3);
    expect(collector.writer.recordJournalFact).toHaveBeenNthCalledWith(1, 1523463, 1, 1, 0, expect.any(Number), 0);
    expect(collector.writer.recordJournalFact).toHaveBeenNthCalledWith(2, 1523478, 2, 2, 0, expect.any(Number), 1);
    expect(collector.writer.recordJournalFact).toHaveBeenNthCalledWith(3, 1527685, 1, 1, 0, expect.any(Number), 2);
  });

  it('reads the log chunk index before writing, so a rotation triggered by this write doesn\'t affect it', () => {
    const collector = makeCollector();
    collector.writer.writeLog = vi.fn(() => {
      // simulate rotation happening as a side effect of this write
      collector.writer.getCurrentLogChunkIndex = vi.fn(() => 7);
    });
    collector.writer.getCurrentLogChunkIndex = vi.fn(() => 3);

    collector.pendingLogs = [
      { timestamp: 1523463, tool: 'core', level: 1, message: 'Unsupported audio format 0', thread_id: -680877248, caller: null },
    ];

    collector.flushLogs();

    expect(collector.writer.recordJournalFact).toHaveBeenCalledWith(1523463, 1, 1, 3, expect.any(Number), 0);
  });

  it('ignores info-level logs, never recording a journal fact for them', () => {
    const collector = makeCollector();

    collector.pendingLogs = [
      { timestamp: 1523463, tool: 'core', level: 0, message: 'some info line', thread_id: -680877248, caller: null },
    ];

    collector.flushLogs();

    expect(collector.writer.recordJournalFact).not.toHaveBeenCalled();
  });
});
