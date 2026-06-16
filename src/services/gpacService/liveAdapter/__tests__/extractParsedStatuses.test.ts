import { describe, it, expect } from 'vitest';
import { extractParsedStatuses } from '../extractParsedStatuses';

describe('extractParsedStatuses', () => {
  it('maps each filter idx to its parsed status, preserving order', () => {
    const result = extractParsedStatuses([
      { idx: 6, status: 'seg=7' },
      { idx: 2, status: 'fps=30' },
    ]);

    expect(result).toHaveLength(2);

    expect(result[0].filterIdx).toBe(6);
    expect(result[0].parsedStatus.raw).toBe('seg=7');
    expect(result[0].parsedStatus.entries).toHaveLength(1);

    expect(result[1].filterIdx).toBe(2);
    expect(result[1].parsedStatus.raw).toBe('fps=30');
    expect(result[1].parsedStatus.entries).toHaveLength(1);
  });
});
