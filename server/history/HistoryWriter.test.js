import { describe, it, expect } from 'vitest';
import { HistoryWriter } from './HistoryWriter.js';

describe('HistoryWriter journal index', () => {
  it('has no journal pointer when no fact was ever recorded', () => {
    const writer = new HistoryWriter('test-history');

    expect(writer._getJournalPointer()).toBeUndefined();
  });

  it('summarizes recorded facts into a journal pointer with error/warning counts', () => {
    const writer = new HistoryWriter('test-history');

    writer.recordJournalFact(1523463, 1);
    writer.recordJournalFact(1523478, 2);
    writer.recordJournalFact(1527685, 1);

    expect(writer._getJournalPointer()).toEqual({
      file: 'journal_index.json',
      format: 'columnar-delta-v1',
      eventCount: 3,
      errorCount: 2,
      warningCount: 1,
    });
  });
});
