import { useMemo } from 'react';
import type { GraphFilterData } from '@/types/domain/gpac/model';
import type { SessionFilterStats } from '@/shared/store/slices/sessionStatsSlice';
import { determineFilterSessionType } from '@/components/views/graph/utils/filterType';

export interface StatsCounters {
  total: number;
  active: number;
  sources: number;
  sinks: number;
  processing: number;
}

export interface SystemStats {
  totalBytes: number;
  totalPackets: number;
  activeFilters: number;
}

export const useStatsCalculations = (
  rawFiltersFromServer: GraphFilterData[],
  filtersWithLiveStats: SessionFilterStats[]
) => {
  const statsCounters = useMemo((): StatsCounters => {
    if (!rawFiltersFromServer.length) {
      return { total: 0, active: 0, sources: 0, sinks: 0, processing: 0 };
    }

    return {
      total: rawFiltersFromServer.length,
      sources: rawFiltersFromServer.filter((f) => determineFilterSessionType(f) === 'source').length,
      sinks: rawFiltersFromServer.filter((f) => determineFilterSessionType(f) === 'sink').length,
      active: filtersWithLiveStats.filter(
        (f) =>
          (f.bytes_done && f.bytes_done > 0) ||
          (f.pck_done && f.pck_done > 0) ||
          f.status?.toLowerCase().includes('running')
      ).length,
      processing: filtersWithLiveStats.filter((f) => f.pck_done && f.pck_done > 0).length,
    };
  }, [rawFiltersFromServer, filtersWithLiveStats]);

  const systemStats = useMemo((): SystemStats => {
    if (!filtersWithLiveStats.length) {
      return { totalBytes: 0, totalPackets: 0, activeFilters: 0 };
    }

    return {
      totalBytes: filtersWithLiveStats.reduce((sum, filter) => sum + (filter.bytes_done || 0), 0),
      totalPackets: filtersWithLiveStats.reduce((sum, filter) => sum + (filter.pck_done || 0), 0),
      activeFilters: filtersWithLiveStats.filter(
        (f) => (f.bytes_done || 0) > 0 || (f.pck_done || 0) > 0
      ).length,
    };
  }, [filtersWithLiveStats]);

  return { statsCounters, systemStats };
};