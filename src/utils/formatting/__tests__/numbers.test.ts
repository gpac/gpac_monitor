import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatBitrate,
  roundNumber,
  formatPacketRate,
  formatPercent,
} from '../numbers';

describe('formatNumber', () => {
  it('returns raw number under 1000', () => {
    expect(formatNumber(42)).toBe('42');
    expect(formatNumber(999)).toBe('999');
  });

  it('formats thousands with K suffix', () => {
    expect(formatNumber(1500)).toBe('1.5K');
    expect(formatNumber(999999)).toBe('1000.0K');
  });

  it('formats millions with M suffix', () => {
    expect(formatNumber(2500000)).toBe('2.5M');
  });

  it('formats billions with G suffix', () => {
    expect(formatNumber(3000000000)).toBe('3.0G');
  });
});

describe('formatBitrate', () => {
  it('returns 0 b/s for undefined', () => {
    expect(formatBitrate(undefined)).toBe('0 b/s');
  });

  it('returns 0 b/s for zero', () => {
    expect(formatBitrate(0)).toBe('0 b/s');
  });

  it('formats bits per second', () => {
    expect(formatBitrate(500)).toBe('500 b/s');
  });

  it('formats kilobits', () => {
    expect(formatBitrate(1500)).toBe('1.50 Kb/s');
  });

  it('formats megabits', () => {
    expect(formatBitrate(5000000)).toBe('5.00 Mb/s');
  });

  it('formats gigabits', () => {
    expect(formatBitrate(2000000000)).toBe('2.00 Gb/s');
  });
});

describe('roundNumber', () => {
  it('rounds to 2 decimals by default', () => {
    expect(roundNumber(3.14159)).toBe(3.14);
  });

  it('rounds to specified decimals', () => {
    expect(roundNumber(3.14159, 3)).toBe(3.142);
    expect(roundNumber(3.14159, 0)).toBe(3);
  });
});

describe('formatPacketRate', () => {
  it('returns 0 pck/s for undefined', () => {
    expect(formatPacketRate(undefined)).toBe('0 pck/s');
  });

  it('formats raw packets', () => {
    expect(formatPacketRate(500)).toBe('500 pck/s');
  });

  it('formats kilo packets', () => {
    expect(formatPacketRate(1500)).toBe('1.50 Kpck/s');
  });

  it('formats mega packets', () => {
    expect(formatPacketRate(2000000)).toBe('2.00 Mpck/s');
  });
});

describe('formatPercent', () => {
  it('formats with 1 decimal', () => {
    expect(formatPercent(42.567)).toBe('42.6%');
    expect(formatPercent(0)).toBe('0.0%');
  });
});
