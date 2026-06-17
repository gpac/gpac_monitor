import { describe, it, expect } from 'vitest';
import { formatFractionAsTimeWithRaw, formatCompactTime } from '../time';

describe('formatCompactTime', () => {
  it('formats 0 µs as 00:00', () => {
    expect(formatCompactTime(0)).toBe('00:00');
  });
  it('formats 8s as 00:08', () => {
    expect(formatCompactTime(8_000_000)).toBe('00:08');
  });
  it('formats 65s as 01:05', () => {
    expect(formatCompactTime(65_000_000)).toBe('01:05');
  });
  it('formats 1h1m1s as 01:01:01', () => {
    expect(formatCompactTime(3_661_000_000)).toBe('01:01:01');
  });
  it('truncates sub-second µs', () => {
    expect(formatCompactTime(8_500_000)).toBe('00:08');
  });
  it('formats 59m59s without hours', () => {
    expect(formatCompactTime(3_599_000_000)).toBe('59:59');
  });
});

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
