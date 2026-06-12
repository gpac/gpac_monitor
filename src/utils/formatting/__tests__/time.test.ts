import { describe, it, expect } from 'vitest';
import {
  formatTime,
  microsecondsToSeconds,
  formatBufferTime,
  formatChartSeconds,
  formatCompactTime,
  formatFractionAsTimeWithRaw,
} from '../time';

describe('formatTime', () => {
  it('returns 0 ms for undefined', () => {
    expect(formatTime(undefined)).toBe('0 ms');
  });

  it('formats microseconds', () => {
    expect(formatTime(500)).toBe('500 μs');
  });

  it('formats milliseconds', () => {
    expect(formatTime(5000)).toBe('5.00 ms');
  });

  it('formats seconds', () => {
    expect(formatTime(5_000_000)).toBe('5.00 s');
  });

  it('formats minutes + seconds', () => {
    expect(formatTime(90_000_000)).toBe('1m 30s');
  });

  it('formats hours', () => {
    expect(formatTime(3_660_000_000)).toBe('1h 1m 0s');
  });
});

describe('microsecondsToSeconds', () => {
  it('converts correctly', () => {
    expect(microsecondsToSeconds(1_000_000)).toBe(1);
    expect(microsecondsToSeconds(500_000)).toBe(0.5);
  });
});

describe('formatBufferTime', () => {
  it('returns 0 ms for zero', () => {
    expect(formatBufferTime(0)).toBe('0 ms');
  });

  it('formats milliseconds', () => {
    expect(formatBufferTime(500_000)).toBe('500 ms');
  });

  it('formats seconds when >= 1000ms', () => {
    expect(formatBufferTime(2_000_000)).toBe('2.0 s');
  });
});

describe('formatChartSeconds', () => {
  it('formats under 60s', () => {
    expect(formatChartSeconds(30)).toBe('30s');
  });

  it('formats minutes with remaining seconds', () => {
    expect(formatChartSeconds(90)).toBe('1m 30s');
  });

  it('formats exact minutes without seconds', () => {
    expect(formatChartSeconds(120)).toBe('2m');
  });

  it('formats hours with remaining minutes', () => {
    expect(formatChartSeconds(3900)).toBe('1h 5m');
  });

  it('formats exact hours', () => {
    expect(formatChartSeconds(3600)).toBe('1h');
  });
});

describe('formatCompactTime', () => {
  it('returns 0ms for undefined or zero', () => {
    expect(formatCompactTime(undefined)).toBe('0ms');
    expect(formatCompactTime(0)).toBe('0ms');
  });

  it('formats microseconds', () => {
    expect(formatCompactTime(500)).toBe('500μs');
  });

  it('formats milliseconds', () => {
    expect(formatCompactTime(5000)).toBe('5ms');
  });

  it('formats seconds with decimal', () => {
    expect(formatCompactTime(5_500_000)).toBe('5.5s');
  });

  it('formats mm:ss', () => {
    expect(formatCompactTime(90_000_000)).toBe('01:30');
  });

  it('formats h:mm for >= 1 hour', () => {
    expect(formatCompactTime(3_660_000_000)).toBe('1:01h');
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
