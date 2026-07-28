import { describe, it, expect, vi } from 'vitest';
import { HistoryCollector } from './HistoryCollector.js';

function makeCollector() {
  const collector = new HistoryCollector('test-history');
  collector.writer.writeLog = vi.fn();
  collector.writer.recordJournalFact = vi.fn();
  return collector;
}

describe('HistoryCollector args-change indexing', () => {
  it('emits a single args-change index when one live arg update goes through both record paths', () => {
    const collector = makeCollector();
    collector.writer.addEventIndex = vi.fn();
    collector.writer.writeEvent = vi.fn(() => false);

    collector.recordFilterArgsUpdate(3, 'fullscreen', 'true');
    collector.recordArgUpdated([3], { 3: [{ name: 'fullscreen', value: 'true' }] });

    expect(collector.writer.addEventIndex).toHaveBeenCalledTimes(1);
    expect(collector.writer.addEventIndex).toHaveBeenCalledWith(expect.any(Number), 'args-change');
  });

  it('still writes the filter_args_update event on the command path, without indexing it', () => {
    const collector = makeCollector();
    collector.writer.addEventIndex = vi.fn();
    collector.writer.writeEvent = vi.fn(() => false);

    collector.recordFilterArgsUpdate(3, 'fullscreen', 'true');

    expect(collector.writer.addEventIndex).not.toHaveBeenCalled();
    expect(collector.writer.writeEvent).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(collector.writer.writeEvent.mock.calls[0][0]);
    expect(payload.message).toBe('filter_args_update');
    expect(payload.payload).toEqual({ filter_idx: 3, arg_name: 'fullscreen', value: 'true' });
  });
});

describe('HistoryCollector flushLogs', () => {
  it('records an error fact using the log line\'s own timestamp, not the flush-time clock', () => {
    const collector = makeCollector();

    // real bug report line: batch flushed at ts_us=1533744, but this line
    // was actually captured at timestamp=1523463
    collector.pendingLogs = [
      { timestamp: 1523463, tool: 'core', level: 1, message: 'Unsupported audio format 0', thread_id: -680877248, caller: null },
    ];

    collector.flushLogs();

    expect(collector.writer.recordJournalFact).toHaveBeenCalledWith(1523463, 1);
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
    expect(collector.writer.recordJournalFact).toHaveBeenNthCalledWith(1, 1523463, 1);
    expect(collector.writer.recordJournalFact).toHaveBeenNthCalledWith(2, 1523478, 2);
    expect(collector.writer.recordJournalFact).toHaveBeenNthCalledWith(3, 1527685, 1);
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
