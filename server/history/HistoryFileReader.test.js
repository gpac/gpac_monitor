import { describe, it, expect, vi } from 'vitest';
import * as std from 'std';
import { HistoryFileReader } from './HistoryFileReader.js';

describe('HistoryFileReader readEventsRange', () => {
  it('returns an empty array when the manifest is truncated/invalid JSON', () => {
    const reader = new HistoryFileReader('test-history');
    vi.spyOn(std, 'open').mockReturnValue({
      readAsString: () => '{"version":1,"startUs":0,"chunkCount":2',
      close: () => {},
    });

    const events = reader.readEventsRange('123', 0, 1000);

    expect(events).toEqual([]);

    vi.restoreAllMocks();
  });
});
