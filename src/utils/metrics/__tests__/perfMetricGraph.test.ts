import { describe, it, expect } from 'vitest';
import { buildPerfSamplesFromStats } from '../perfMetricGraph';
import type { SessionFilterStats } from '../../../shared/store/slices/sessionStatsSlice';

function makeFilter(
  overrides: Partial<SessionFilterStats> & { idx: number },
): SessionFilterStats {
  return {
    status: '',
    bytes_done: 0,
    bytes_sent: 0,
    pck_sent: 0,
    pck_done: 0,
    nb_opid: 0,
    nb_ipid: 0,
    time: 0,
    ...overrides,
  };
}

describe('buildPerfSamplesFromStats', () => {
  it('returns [] when tsUs is undefined', () => {
    expect(buildPerfSamplesFromStats([], {}, undefined, 1000, 1000)).toEqual(
      [],
    );
  });

  it('returns [] when prevTsUs is null', () => {
    expect(buildPerfSamplesFromStats([], {}, 6000, null, 1000)).toEqual([]);
  });

  it('returns [] when sessionStartUs is null', () => {
    expect(buildPerfSamplesFromStats([], {}, 6000, 1000, null)).toEqual([]);
  });

  it('returns [] when Δt is 0', () => {
    expect(buildPerfSamplesFromStats([], {}, 6000, 6000, 1000)).toEqual([]);
  });

  it('skips filter with no previous entry', () => {
    const stats = [makeFilter({ idx: 0, bytes_sent: 1000, bytes_done: 500 })];
    expect(buildPerfSamplesFromStats(stats, {}, 6000, 1000, 0)).toEqual([]);
  });

  it('computes outband/inband rates and sessionTimeUs correctly', () => {
    const stats = [
      makeFilter({
        idx: 0,
        bytes_sent: 2000,
        bytes_done: 1000,
        last_task_time: 42,
      }),
    ];
    const prev = {
      '0': makeFilter({ idx: 0, bytes_sent: 1000, bytes_done: 500 }),
    };
    const result = buildPerfSamplesFromStats(
      stats,
      prev,
      3_000_000,
      1_000_000,
      0,
    );
    expect(result).toEqual([
      {
        filterId: '0',
        outband: { timestamp: 3_000_000, value: 500 },
        inband: { timestamp: 3_000_000, value: 250 },
        lastTaskTime: { timestamp: 3_000_000, value: 42 },
      },
    ]);
  });

  it('clamps negative delta to 0', () => {
    const stats = [makeFilter({ idx: 0, bytes_sent: 500, bytes_done: 200 })];
    const prev = {
      '0': makeFilter({ idx: 0, bytes_sent: 1000, bytes_done: 500 }),
    };
    const result = buildPerfSamplesFromStats(
      stats,
      prev,
      3_000_000,
      1_000_000,
      0,
    );
    expect(result[0].outband.value).toBe(0);
    expect(result[0].inband.value).toBe(0);
  });

  it('defaults last_task_time to 0 when absent', () => {
    const stats = [makeFilter({ idx: 0, bytes_sent: 2000, bytes_done: 1000 })];
    const prev = {
      '0': makeFilter({ idx: 0, bytes_sent: 1000, bytes_done: 500 }),
    };
    const result = buildPerfSamplesFromStats(
      stats,
      prev,
      3_000_000,
      1_000_000,
      0,
    );
    expect(result[0].lastTaskTime.value).toBe(0);
  });
});
