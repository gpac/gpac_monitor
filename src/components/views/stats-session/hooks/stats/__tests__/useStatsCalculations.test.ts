import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import type { EnrichedFilterOverview } from '@/types/domain/gpac/model';
import { useStatsCalculations } from '../useStatsCalculations';

const buildFilter = (
  idx: number,
  nbIpid: number,
  nbOpid: number,
): EnrichedFilterOverview => ({
  name: `filter${idx}`,
  type: 'test',
  idx,
  ID: null,
  itag: null,
  nb_ipid: nbIpid,
  nb_opid: nbOpid,
  ipid: {},
  opid: {},
  status: '',
  bytes_done: 0,
  bytes_sent: 0,
  pck_done: 0,
  pck_sent: 0,
  time: 0,
});

describe('useStatsCalculations', () => {
  it('counts sources and sinks from PID counts', () => {
    const filters = [
      buildFilter(0, 0, 1),
      buildFilter(1, 1, 1),
      buildFilter(2, 1, 0),
    ];
    const { result } = renderHook(() => useStatsCalculations(filters, []));

    expect(result.current.statsCounters.sources).toBe(1);
    expect(result.current.statsCounters.sinks).toBe(1);
  });
});
