import type {
  SessionFilterStatistics,
  PIDDynamicData,
} from '@/types/domain/gpac/filter-stats';

export type PIDDynamicByFilter = Record<
  string,
  {
    ipids?: Record<string, PIDDynamicData>;
    opids?: Record<string, PIDDynamicData>;
  }
>;

/**
 * Full dynamic PID data for table + tooltip (buffer, bitrate, full PIDStats).
 * Feeds setFilterPids → pidsByFilter → usePIDBufferStats / usePIDPerformanceStats.
 */
export function extractPIDDynamic(
  stats: SessionFilterStatistics[],
): PIDDynamicByFilter {
  const result: PIDDynamicByFilter = {};
  for (const stat of stats) {
    const filterKey = stat.idx.toString();
    if (stat.ipids && Object.keys(stat.ipids).length > 0) {
      result[filterKey] = result[filterKey] ?? {};
      result[filterKey].ipids = stat.ipids;
    }
    if (stat.opids && Object.keys(stat.opids).length > 0) {
      result[filterKey] = result[filterKey] ?? {};
      result[filterKey].opids = stat.opids;
    }
  }
  return result;
}
