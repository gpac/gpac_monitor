import { describe, it, expect } from 'vitest';
import {
  ChartDuration,
  DURATION_LABELS,
  getDurationInMs,
  getMaxPointsFromDuration,
  UNLIMITED_MAX_POINTS,
} from '../duration';

describe('ChartDuration', () => {
  it('exposes a label for every duration', () => {
    const durations: ChartDuration[] = [
      '20s',
      '1min',
      '5min',
      '10min',
      'unlimited',
    ];
    durations.forEach((duration) => {
      expect(DURATION_LABELS[duration]).toBeTruthy();
    });
  });

  it('converts durations to milliseconds', () => {
    expect(getDurationInMs('20s')).toBe(20_000);
    expect(getDurationInMs('1min')).toBe(60_000);
    expect(getDurationInMs('5min')).toBe(300_000);
    expect(getDurationInMs('10min')).toBe(600_000);
    expect(getDurationInMs('unlimited')).toBe(Infinity);
  });

  it('computes max points based on update interval', () => {
    expect(getMaxPointsFromDuration('20s', 1000)).toBe(20);
    expect(getMaxPointsFromDuration('10min', 1000)).toBe(600);
    expect(getMaxPointsFromDuration('10min', 150)).toBe(
      Math.ceil(600_000 / 150),
    );
  });

  it('returns UNLIMITED_MAX_POINTS for unlimited duration', () => {
    expect(getMaxPointsFromDuration('unlimited', 1000)).toBe(
      UNLIMITED_MAX_POINTS,
    );
  });
});
