import { EnrichedFilterOverview } from '@/types/domain/gpac/model';
import { GraphFilterData, SessionFilterStatistics } from '@/types/domain/gpac';

/**
 * Enriches static filter data with dynamic session statistics
 */
export function enrichFiltersWithStats(
  staticFilters: GraphFilterData[],
  sessionStats: SessionFilterStatistics[],
): EnrichedFilterOverview[] {
  return staticFilters.map((staticFilter): EnrichedFilterOverview => {
    const dynamicStats = sessionStats.find(
      (stat) => stat.idx === staticFilter.idx,
    );
    return {
      ...staticFilter,
      ipid: Object.fromEntries(
        Object.entries(staticFilter.ipid).map(([key, value]) => [
          key,
          { ...value, buffer: 0, buffer_total: 0 },
        ]),
      ),
      opid: Object.fromEntries(
        Object.entries(staticFilter.opid).map(([key, value]) => [
          key,
          { ...value, buffer: 0, buffer_total: 0 },
        ]),
      ),
      status: dynamicStats?.status || staticFilter.status,
      bytes_done: dynamicStats?.bytes_done || 0,
      bytes_sent: dynamicStats?.bytes_sent || 0,
      pck_done: dynamicStats?.pck_done || 0,
      pck_sent: dynamicStats?.pck_sent || 0,
      time: dynamicStats?.time || 0,
      tasks: 0,
      errors: 0,
    };
  });
}
