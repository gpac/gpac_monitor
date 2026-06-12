import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEnrichedStats } from '../useEnrichedStats';
import { enrichedStatsWorkerService } from '@/services/workers/enrichedStatsWorkerService';
import { useAppSelector } from '@/shared/hooks/redux';
import type { GpacNodeData } from '@/types/domain/gpac/model';

vi.mock('@/shared/hooks/redux', () => ({
  useAppSelector: vi.fn(),
}));

vi.mock('@/services/workers/enrichedStatsWorkerService', () => ({
  enrichedStatsWorkerService: {
    setDefinitions: vi.fn(),
    enrichStats: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
  },
}));

const makeFilter = (status: string): GpacNodeData =>
  ({
    idx: 0,
    name: 'ffenc',
    status,
    bytes_done: 0,
    pck_done: 0,
    time: 0,
    errors: 0,
    nb_ipid: 1,
    nb_opid: 1,
  }) as GpacNodeData;

describe('useEnrichedStats — definitions dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('re-calls setDefinitions when definitions change after initial render', () => {
    // Scenario: custom_metrics arrives after the first filter_stats tick.
    // definitions starts empty, then gets populated.
    // useEffect must re-fire so the worker gets the updated definitions.

    const emptyDefs = {};
    const populatedDefs = {
      Q: { type: 'num' as const, label: 'Quality', freg: 'ffenc' },
    };

    vi.mocked(useAppSelector).mockReturnValue(emptyDefs);

    const filters = [makeFilter('Q=800')];
    const { rerender } = renderHook(() => useEnrichedStats(filters));

    expect(enrichedStatsWorkerService.setDefinitions).toHaveBeenCalledWith(
      emptyDefs,
    );
    expect(enrichedStatsWorkerService.setDefinitions).toHaveBeenCalledTimes(1);

    // Simulate custom_metrics arriving → definitions updated in Redux
    vi.mocked(useAppSelector).mockReturnValue(populatedDefs);
    rerender();

    // Bug: definitions not in deps → effect doesn't re-fire → still called once   ← RED
    // Fix: definitions in deps → effect re-fires → called twice with new defs      ← GREEN
    expect(enrichedStatsWorkerService.setDefinitions).toHaveBeenCalledWith(
      populatedDefs,
    );
    expect(enrichedStatsWorkerService.setDefinitions).toHaveBeenCalledTimes(2);
  });
});
