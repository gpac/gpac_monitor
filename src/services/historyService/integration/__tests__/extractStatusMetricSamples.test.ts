import { describe, it, expect } from 'vitest';
import { extractStatusMetricSamples } from '../extractStatusMetricSamples';
import type { SessionFilterStatistics } from '@/types/domain/gpac/filter-stats';

function makeStats(idx: number, status: string): SessionFilterStatistics {
  return {
    idx,
    status,
    bytes_done: 0,
    bytes_sent: 0,
    pck_sent: 0,
    pck_done: 0,
    time: 0,
    nb_ipid: 0,
    nb_opid: 0,
  };
}

describe('extractStatusMetricSamples', () => {
  it('sessionTimeUs = tsUs - sessionStartUs (session-relative)', () => {
    const sessionStartUs = 1_000_000;
    const tsUs = 1_049_000_000;
    const stats = [makeStats(0, 'fps=109.57')];

    const samples = extractStatusMetricSamples(stats, tsUs, sessionStartUs);

    expect(samples).toHaveLength(1);
    expect(samples[0].sample.sessionTimeUs).toBe(tsUs - sessionStartUs);
  });

  it('skips filters with empty status', () => {
    const stats = [makeStats(0, ''), makeStats(1, 'fps=60')];
    const samples = extractStatusMetricSamples(stats, 2_000_000, 1_000_000);
    expect(samples).toHaveLength(1);
    expect(samples[0].key).toBe('1:fps');
  });

  it('extracts only graphable numeric metrics (no fractions, no pc unit)', () => {
    const stats = [makeStats(0, 'fps=30 prog=5/10 ohead=3 pc Q=1180')];
    const samples = extractStatusMetricSamples(stats, 2_000_000, 1_000_000);
    const keys = samples.map((sample) => sample.key);
    expect(keys).toContain('0:fps');
    expect(keys).toContain('0:Q');
    expect(keys).not.toContain('0:prog');
    expect(keys).not.toContain('0:ohead');
  });
});
