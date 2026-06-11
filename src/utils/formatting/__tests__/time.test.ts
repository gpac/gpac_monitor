import { describe, it, expect } from 'vitest';
import { formatFractionAsTimeWithRaw } from '../time';

describe('formatFractionAsTimeWithRaw', () => {
  it('formats fraction with readable duration and raw values', () => {
    expect(formatFractionAsTimeWithRaw(1918917, 90000)).toBe(
      '21.32s (1918917/90000)',
    );
  });

  it('formats small fractions correctly', () => {
    expect(formatFractionAsTimeWithRaw(7380, 90000)).toBe('0.08s (7380/90000)');
  });

  it('returns — for den = 0', () => {
    expect(formatFractionAsTimeWithRaw(100, 0)).toBe('—');
  });
});
