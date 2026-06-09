import { describe, it, expect } from 'vitest';
import type { StatusNum } from '@/workers/filterStatusParser';
import { isGraphableStatusMetric } from '../statusMetricGraph';

function num(
  key: string,
  value: number,
  extra: Partial<StatusNum> = {},
): StatusNum {
  return { type: 'num', key, value, ...extra };
}

describe('isGraphableStatusMetric', () => {
  it.each([
    ['fps scalar', num('fps', 109.57)],
    ['fps via unit', num('rate', 60, { unit: 'fps' })],
    ['queue depth Q', num('Q', 1180)],
    ['send rate kbps', num('s_rate', 850, { unit: 'kbps' })],
    ['recv rate kbps', num('r_rate', 640, { unit: 'kbps' })],
    ['period as numeric', num('period', 1)],
    ['r_bytes cumulative', num('r_bytes', 4096)],
    ['r_pck cumulative', num('r_pck', 42)],
    ['s_bytes cumulative', num('s_bytes', 2048)],
    ['s_pck cumulative', num('s_pck', 18)],
  ])('graphs numeric scalar %s', (_label, entry) => {
    expect(isGraphableStatusMetric(entry)).toBe(true);
  });

  it.each([
    [
      'fraction (buffer/prog)',
      num('buffer', 0.5, { fraction: { num: 50, den: 100 }, unit: 'ms' }),
    ],
    [
      'fraction time',
      num('time', 0, { fraction: { num: 416221, den: 12800 } }),
    ],
    ['NaN value', num('fps', Number.NaN)],
    ['Infinity value', num('fps', Number.POSITIVE_INFINITY)],
    ['percent key pc', num('pc', 7)],
    ['overhead ohead u=pc', num('ohead', 3, { unit: 'pc' })],
  ])('rejects non-graphable entry %s', (_label, entry) => {
    expect(isGraphableStatusMetric(entry)).toBe(false);
  });
});
