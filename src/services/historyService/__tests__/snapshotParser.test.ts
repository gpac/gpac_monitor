import { describe, it, expect } from 'vitest';
import { parseSnapshot } from '../snapshotParser';

describe('parseSnapshot', () => {
  it('rejects a truncated snapshot without filters before hydrate maps them', () => {
    expect(() => parseSnapshot({ ts_us: 0 })).toThrow(
      '[SnapshotParser] snapshot must have a filters array',
    );
  });

  it('returns a snapshot with a filters array unchanged', () => {
    const raw = { ts_us: 0, command_line: null, graph_v: 1, filters: [] };
    expect(parseSnapshot(raw)).toBe(raw);
  });
});
