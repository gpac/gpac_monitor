import { describe, it, expect } from 'vitest';
import { sessionStatsEqual } from '../sessionStatsEqual';
import type { SessionFilterStatistics } from '@/types/domain/gpac/filter-stats';

const snapshot = (): SessionFilterStatistics[] => [
  {
    idx: 0,
    status: 'rti=1',
    bytes_done: 188416,
    bytes_sent: 0,
    pck_sent: 0,
    pck_done: 1024,
    time: 500000,
    nb_ipid: 0,
    nb_opid: 1,
    is_eos: false,
  },
  {
    idx: 1,
    status: 'EOS',
    bytes_done: 900000,
    bytes_sent: 900000,
    pck_sent: 512,
    pck_done: 512,
    time: 900000,
    nb_ipid: 1,
    nb_opid: 0,
    is_eos: true,
  },
];

describe('sessionStatsEqual', () => {
  it('identical snapshots → true', () => {
    expect(sessionStatsEqual(snapshot(), snapshot())).toBe(true);
  });

  it('same reference → true', () => {
    const stats = snapshot();
    expect(sessionStatsEqual(stats, stats)).toBe(true);
  });

  it('different length → false', () => {
    expect(sessionStatsEqual(snapshot(), snapshot().slice(0, 1))).toBe(false);
  });

  it('one progressing field (bytes_done) → false', () => {
    const next = snapshot();
    next[0].bytes_done += 4096;
    expect(sessionStatsEqual(snapshot(), next)).toBe(false);
  });

  it('is_eos flip → false', () => {
    const next = snapshot();
    next[0].is_eos = true;
    expect(sessionStatsEqual(snapshot(), next)).toBe(false);
  });
});
