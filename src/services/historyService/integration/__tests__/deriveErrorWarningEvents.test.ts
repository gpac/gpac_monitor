import { describe, it, expect } from 'vitest';
import { deriveErrorWarningEvents } from '../deriveTimelineEvents';
import type { JournalIndex } from '../../types';

describe('deriveErrorWarningEvents', () => {
  it('decodes a columnar journal index into TimelineEvents with both time references', () => {
    const journalIndex: JournalIndex = {
      baseTsUs: 1523463,
      tsDeltaUs: [0],
      types: [1],
    };

    const [event] = deriveErrorWarningEvents(journalIndex, 835061);

    expect(event.type).toBe('error');
    expect(event.sessionTimeUs).toBe(688402);
    expect(event.loggerTimeUs).toBe(1523463);
  });

  it('decodes multiple facts at their own deltas, in order', () => {
    const journalIndex: JournalIndex = {
      baseTsUs: 1523463,
      tsDeltaUs: [0, 15, 4222],
      types: [1, 2, 1],
    };

    const events = deriveErrorWarningEvents(journalIndex, 835061);

    expect(events.map((event) => event.loggerTimeUs)).toEqual([
      1523463, 1523478, 1527685,
    ]);
    expect(events.map((event) => event.type)).toEqual([
      'error',
      'warning',
      'error',
    ]);
  });

  it('returns an empty array when there is no journal index (no errors ever recorded)', () => {
    expect(deriveErrorWarningEvents(null, 835061)).toEqual([]);
  });
});
