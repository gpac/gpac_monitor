import { describe, it, expect } from 'vitest';
import type {
  StatusNum,
  ParsedFilterStatus,
} from '@/utils/metrics/filterStatusParser';
import {
  isGraphableStatusMetric,
  buildStatusSamplesFromStats,
  buildStatusSamplesFromParsed,
} from '../statusMetricGraph';

function num(
  key: string,
  value: number,
  extra: Partial<StatusNum> = {},
): StatusNum {
  return { type: 'num', key, value, ...extra };
}

// Regression: adapter loses tick when filter_stats replaces session_stats (ts_us absent)
describe('buildStatusSamplesFromStats', () => {
  const stats = [{ idx: 0, status: 'fps=60 Q=100' }];
  const sessionStartUs = 1000;

  it('returns [] when ts_us is undefined (filter_stats has no ts_us)', () => {
    expect(
      buildStatusSamplesFromStats(stats, undefined, sessionStartUs),
    ).toEqual([]);
  });

  it('returns [] when ts_us is null', () => {
    expect(buildStatusSamplesFromStats(stats, null, sessionStartUs)).toEqual(
      [],
    );
  });

  it('returns [] when sessionStartUs is null (first tick not yet received)', () => {
    expect(buildStatusSamplesFromStats(stats, 5000, null)).toEqual([]);
  });

  it('produces sessionTimeUs = ts_us - sessionStartUs', () => {
    const samples = buildStatusSamplesFromStats(stats, 6000, sessionStartUs);
    expect(samples.length).toBeGreaterThan(0);
    expect(samples[0].sample.sessionTimeUs).toBe(5000);
  });

  it('returns [] for empty stats array', () => {
    expect(buildStatusSamplesFromStats([], 5000, sessionStartUs)).toEqual([]);
  });
});

describe('buildStatusSamplesFromParsed', () => {
  const parsed: ParsedFilterStatus = {
    raw: 'fps=60 Q=100',
    entries: [num('fps', 60), num('Q', 100)],
  };
  const sessionStartUs = 1000;

  it('returns [] when ts_us is undefined', () => {
    expect(
      buildStatusSamplesFromParsed({ 0: parsed }, undefined, sessionStartUs),
    ).toEqual([]);
  });

  it('returns [] when ts_us is null', () => {
    expect(
      buildStatusSamplesFromParsed({ 0: parsed }, null, sessionStartUs),
    ).toEqual([]);
  });

  it('returns [] when sessionStartUs is null', () => {
    expect(buildStatusSamplesFromParsed({ 0: parsed }, 6000, null)).toEqual([]);
  });

  it('produces sessionTimeUs = ts_us - sessionStartUs', () => {
    const samples = buildStatusSamplesFromParsed(
      { 0: parsed },
      6000,
      sessionStartUs,
    );
    expect(samples.length).toBe(2);
    expect(samples.every((s) => s.sample.sessionTimeUs === 5000)).toBe(true);
  });

  it('prefixes each key with filterIdx', () => {
    const samples = buildStatusSamplesFromParsed(
      { 3: parsed },
      6000,
      sessionStartUs,
    );
    expect(samples.every((s) => s.key.startsWith('3:'))).toBe(true);
  });
});

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
