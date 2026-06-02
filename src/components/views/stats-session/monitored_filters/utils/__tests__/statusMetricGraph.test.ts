import { describe, it, expect } from 'vitest';
import type { StatusNum } from '@/workers/filterStatusParser';
import {
  isCumulativeMetric,
  isGraphableStatusMetric,
} from '../statusMetricGraph';

function num(
  key: string,
  value: number,
  extra: Partial<StatusNum> = {},
): StatusNum {
  return { type: 'num', key, value, ...extra };
}

describe('isCumulativeMetric', () => {
  it.each([
    ['time', num('time', 13)],
    ['frames', num('frames', 13)],
    ['bytes unit', num('size', 1024, { unit: 'bytes' })],
    ['frame unit f', num('cnt', 50, { unit: 'f' })],
    ['s_bytes', num('s_bytes', 4096)],
    ['r_pck', num('r_pck', 1234)],
    ['nb-prefixed', num('nb_tasks', 7)],
    ['*_done', num('pck_done', 99)],
    ['*_sent', num('pck_sent', 42)],
  ])('flags %s as cumulative', (_label, entry) => {
    expect(isCumulativeMetric(entry)).toBe(true);
  });

  it.each([
    ['fps', num('fps', 109.57)],
    ['queue Q', num('Q', 1180)],
    ['percent pc', num('pc', 7)],
    ['rate kbps', num('r_rate', 850, { unit: 'kbps' })],
  ])('does not flag %s as cumulative', (_label, entry) => {
    expect(isCumulativeMetric(entry)).toBe(false);
  });
});

describe('isGraphableStatusMetric', () => {
  it.each([
    ['fps', num('fps', 109.57)],
    ['fps via unit', num('rate', 60, { unit: 'fps' })],
    ['queue depth Q', num('Q', 1180)],
    ['percent pc', num('pc', 7)],
    ['overhead percent', num('ohead', 3, { unit: 'pc' })],
    ['send rate kbps', num('s_rate', 850, { unit: 'kbps' })],
  ])('graphs instantaneous metric %s', (_label, entry) => {
    expect(isGraphableStatusMetric(entry)).toBe(true);
  });

  it.each([
    ['cumulative time', num('time', 13)],
    ['cumulative frames', num('frames', 13)],
    ['byte total', num('s_bytes', 4096)],
    ['packet total', num('r_pck', 1234)],
  ])('rejects cumulative metric %s', (_label, entry) => {
    expect(isGraphableStatusMetric(entry)).toBe(false);
  });

  it('rejects fraction-valued metrics (handled elsewhere)', () => {
    expect(
      isGraphableStatusMetric(
        num('buffer', 0.5, { fraction: { num: 50, den: 100 }, unit: 'ms' }),
      ),
    ).toBe(false);
  });

  it('rejects prog and buffer keys (dedicated renderers)', () => {
    expect(isGraphableStatusMetric(num('prog', 5))).toBe(false);
    expect(isGraphableStatusMetric(num('buffer', 200))).toBe(false);
  });

  it('rejects non-finite values', () => {
    expect(isGraphableStatusMetric(num('fps', Number.NaN))).toBe(false);
    expect(isGraphableStatusMetric(num('fps', Number.POSITIVE_INFINITY))).toBe(
      false,
    );
  });
});
