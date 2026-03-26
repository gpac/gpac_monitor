import { describe, it, expect } from 'vitest';
import {
  getDurationInMs,
  getMaxPointsFromDuration,
  UNLIMITED_MAX_POINTS,
} from '../duration';

describe('getDurationInMs', () => {
  it('converts 20s to 20000ms', () => {
    expect(getDurationInMs('20s')).toBe(20000);
  });

  it('converts 1min to 60000ms', () => {
    expect(getDurationInMs('1min')).toBe(60000);
  });

  it('converts 5min to 300000ms', () => {
    expect(getDurationInMs('5min')).toBe(300000);
  });

  it('returns Infinity for unlimited', () => {
    expect(getDurationInMs('unlimited')).toBe(Infinity);
  });
});

describe('getMaxPointsFromDuration', () => {
  it('calculates points for 20s at 150ms interval', () => {
    expect(getMaxPointsFromDuration('20s', 150)).toBe(Math.ceil(20000 / 150));
  });

  it('calculates points for 1min at 1000ms interval', () => {
    expect(getMaxPointsFromDuration('1min', 1000)).toBe(60);
  });

  it('returns UNLIMITED_MAX_POINTS for unlimited', () => {
    expect(getMaxPointsFromDuration('unlimited', 150)).toBe(
      UNLIMITED_MAX_POINTS,
    );
  });
});
