import { describe, it, expect } from 'vitest';
import {
  formatMicroseconds,
  formatBps,
  formatLastTsSent,
} from '@/utils/formatting';

describe('formatMicroseconds', () => {
  it('returns — for null, undefined, NaN', () => {
    expect(formatMicroseconds(null)).toBe('—');
    expect(formatMicroseconds(undefined)).toBe('—');
    expect(formatMicroseconds(NaN)).toBe('—');
  });

  it('returns — for negative values (GPAC uint32 overflow)', () => {
    expect(formatMicroseconds(-1)).toBe('—');
    expect(formatMicroseconds(-394014916)).toBe('—');
  });

  it('formats µs range (< 1000)', () => {
    expect(formatMicroseconds(0)).toBe('0µs');
    expect(formatMicroseconds(1)).toBe('1µs');
    expect(formatMicroseconds(999)).toBe('999µs');
  });

  it('formats ms range (1000 – 999999)', () => {
    expect(formatMicroseconds(1000)).toBe('1.0ms');
    expect(formatMicroseconds(14000)).toBe('14.0ms');
    expect(formatMicroseconds(999_999)).toBe('1000.0ms');
  });

  it('formats s range (>= 1 000 000)', () => {
    expect(formatMicroseconds(1_000_000)).toBe('1.00s');
    expect(formatMicroseconds(58_730_000)).toBe('58.73s');
  });
});

describe('formatBps', () => {
  it('returns — for null and undefined', () => {
    expect(formatBps(null)).toBe('—');
    expect(formatBps(undefined)).toBe('—');
  });

  it('returns — for NaN', () => {
    expect(formatBps(NaN)).toBe('—');
  });

  it('formats valid b/s values', () => {
    expect(formatBps(500)).toBe('500 b/s');
    expect(formatBps(160_010)).toContain('Kb/s');
    expect(formatBps(10_000_000)).toContain('Mb/s');
    expect(formatBps(2_000_000_000)).toContain('Gb/s');
  });
});

describe('formatLastTsSent', () => {
  it('returns — for null and undefined', () => {
    expect(formatLastTsSent(null)).toBe('—');
    expect(formatLastTsSent(undefined)).toBe('—');
  });

  it('returns — for zero and negative numbers', () => {
    expect(formatLastTsSent(0)).toBe('—');
    expect(formatLastTsSent(-1)).toBe('—');
  });

  it('formats positive number as seconds', () => {
    expect(formatLastTsSent(58.73)).toBe('58.73s');
    expect(formatLastTsSent(1)).toBe('1.00s');
  });

  it('handles {n, d} fraction format', () => {
    expect(formatLastTsSent({ n: 3000, d: 1000 })).toBe('3.00s');
    expect(formatLastTsSent({ n: 0, d: 1000 })).toBe('0.00s');
  });

  it('handles {num, den} fraction format', () => {
    expect(formatLastTsSent({ num: 3000, den: 1000 })).toBe('3.00s');
  });

  it('returns — when denominator is zero (no timescale)', () => {
    expect(formatLastTsSent({ n: 3000, d: 0 })).toBe('—');
    expect(formatLastTsSent({ num: 3000, den: 0 })).toBe('—');
  });
});
