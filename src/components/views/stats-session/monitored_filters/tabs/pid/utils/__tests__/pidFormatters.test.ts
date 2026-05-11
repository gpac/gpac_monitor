import { describe, it, expect } from 'vitest';
import {
  formatPidBuffer,
  formatPidBitrate,
  formatLastTsSent,
} from '../pidFormatters';

describe('formatPidBuffer', () => {
  it('returns — for null, undefined, NaN', () => {
    expect(formatPidBuffer(null)).toBe('—');
    expect(formatPidBuffer(undefined)).toBe('—');
    expect(formatPidBuffer(NaN)).toBe('—');
  });

  it('returns — for negative values (GPAC uint32 overflow)', () => {
    expect(formatPidBuffer(-1)).toBe('—');
    expect(formatPidBuffer(-394014916)).toBe('—');
  });

  it('formats µs range (< 1000)', () => {
    expect(formatPidBuffer(0)).toBe('0µs');
    expect(formatPidBuffer(1)).toBe('1µs');
    expect(formatPidBuffer(999)).toBe('999µs');
  });

  it('formats ms range (1000 – 999999)', () => {
    expect(formatPidBuffer(1000)).toBe('1.0ms');
    expect(formatPidBuffer(14000)).toBe('14.0ms');
    expect(formatPidBuffer(999_999)).toBe('1000.0ms');
  });

  it('formats s range (>= 1 000 000)', () => {
    expect(formatPidBuffer(1_000_000)).toBe('1.00s');
    expect(formatPidBuffer(58_730_000)).toBe('58.73s');
  });
});

describe('formatPidBitrate', () => {
  it('returns — for null and undefined', () => {
    expect(formatPidBitrate(null)).toBe('—');
    expect(formatPidBitrate(undefined)).toBe('—');
  });

  it('returns — for NaN', () => {
    expect(formatPidBitrate(NaN)).toBe('—');
  });

  it('formats valid b/s values', () => {
    expect(formatPidBitrate(500)).toBe('500 b/s');
    expect(formatPidBitrate(160_010)).toContain('Kb/s');
    expect(formatPidBitrate(10_000_000)).toContain('Mb/s');
    expect(formatPidBitrate(2_000_000_000)).toContain('Gb/s');
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
