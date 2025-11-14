import { useMemo } from 'react';
import type { EnrichedFilterOverview } from '@/types/domain/gpac/model';
import type { SessionFilterStats } from '@/shared/store/slices/sessionStatsSlice';
import type { ActivityLevel } from '@/components/ui/activity-indicator';

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
  systemActivityLevel: ActivityLevel;
  dataProcessingActivityLevel: ActivityLevel;
}

export const useStatsCalculations = (
  enrichedFilters: EnrichedFilterOverview[],
  filtersWithLiveStats: SessionFilterStats[],
) => {
  // Use computed sessionType from worker (no recalculation)
  const statsCounters = useMemo((): StatsCounters => {
    if (!enrichedFilters.length) {
      return { total: 0, active: 0, sources: 0, sinks: 0, processing: 0 };
    }

    return {
      total: enrichedFilters.length,
      sources: enrichedFilters.filter(
        (f) => f.computed?.sessionType === 'source',
      ).length,
      sinks: enrichedFilters.filter((f) => f.computed?.sessionType === 'sink')
        .length,
      active: filtersWithLiveStats.filter(
        (f) =>
          (f.bytes_done && f.bytes_done > 0) ||
          (f.pck_done && f.pck_done > 0) ||
          f.status?.toLowerCase().includes('running'),
      ).length,
      processing: filtersWithLiveStats.filter(
        (f) => f.pck_done && f.pck_done > 0,
      ).length,
    };
  }, [enrichedFilters, filtersWithLiveStats]);

  const systemStats = useMemo((): SystemStats => {
    if (!filtersWithLiveStats.length) {
      return {
        totalBytes: 0,
        totalPackets: 0,
        activeFilters: 0,
        systemActivityLevel: 'low',
        dataProcessingActivityLevel: 'low',
      };
    }

    const totalBytes = filtersWithLiveStats.reduce(
      (sum, filter) => sum + (filter.bytes_done || 0),
      0,
    );

    const totalPackets = filtersWithLiveStats.reduce(
      (sum, filter) => sum + (filter.pck_done || 0),
      0,
    );

    const activeFilters = filtersWithLiveStats.filter(
      (f) => (f.bytes_done || 0) > 0 || (f.pck_done || 0) > 0,
    ).length;

    // System activity based on processing ratio
    const processingRatio =
      statsCounters.total > 0
        ? statsCounters.processing / statsCounters.total
        : 0;
    const systemActivityLevel: ActivityLevel =
      processingRatio > 0.7 ? 'high' : processingRatio > 0.3 ? 'medium' : 'low';

    // Data processing activity based on bytes
    const dataProcessingActivityLevel: ActivityLevel =
      totalBytes > 1000000 ? 'high' : totalBytes > 100000 ? 'medium' : 'low';

    return {
      totalBytes,
      totalPackets,
      activeFilters,
      systemActivityLevel,
      dataProcessingActivityLevel,
    };
  }, [filtersWithLiveStats, statsCounters]);

  return { statsCounters, systemStats };
};
