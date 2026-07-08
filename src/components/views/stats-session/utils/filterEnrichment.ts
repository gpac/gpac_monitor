import { EnrichedFilterOverview } from '@/types/domain/gpac/model';
import { GraphFilterData, SessionFilterStatistics } from '@/types/domain/gpac';
import { sessionFilterStatEqual } from './sessionStatsEqual';

interface EnrichmentCacheEntry {
  staticFilter: GraphFilterData;
  dynamicStats: SessionFilterStatistics | undefined;
  enriched: EnrichedFilterOverview;
}

export type EnrichmentCache = Map<number, EnrichmentCacheEntry>;

function buildEnrichedFilter(
  staticFilter: GraphFilterData,
  dynamicStats: SessionFilterStatistics | undefined,
): EnrichedFilterOverview {
  return {
    ...staticFilter,
    ipid: Object.fromEntries(
      staticFilter.ipid.map((pid) => [
        `ipid-${pid.pid_index}`,
        { ...pid, buffer: 0, buffer_total: 0 },
      ]),
    ),
    opid: Object.fromEntries(
      staticFilter.opid.map((pid) => [
        `opid-${pid.pid_index}`,
        { ...pid, buffer: 0, buffer_total: 0 },
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
    is_eos: dynamicStats?.is_eos ?? false,
  };
}

function dynamicStatsEqual(
  prev: SessionFilterStatistics | undefined,
  next: SessionFilterStatistics | undefined,
): boolean {
  if (prev === next) return true;
  if (!prev || !next) return false;
  return sessionFilterStatEqual(prev, next);
}

/**
 * Enriches static filter data with dynamic session statistics.
 * Reuses the previous enriched object per filter idx when neither the
 * static filter nor its dynamic stats changed, so unaffected filters keep
 * a stable reference across ticks (memoized children skip re-rendering).
 */
export function enrichFiltersWithStatsStable(
  cache: EnrichmentCache,
  staticFilters: GraphFilterData[],
  sessionStats: SessionFilterStatistics[],
): EnrichedFilterOverview[] {
  const statsByIdx = new Map(sessionStats.map((stat) => [stat.idx, stat]));
  const seenIdx = new Set<number>();

  const result = staticFilters.map((staticFilter): EnrichedFilterOverview => {
    seenIdx.add(staticFilter.idx);
    const dynamicStats = statsByIdx.get(staticFilter.idx);
    const cached = cache.get(staticFilter.idx);

    if (
      cached &&
      cached.staticFilter === staticFilter &&
      dynamicStatsEqual(cached.dynamicStats, dynamicStats)
    ) {
      return cached.enriched;
    }

    const enriched = buildEnrichedFilter(staticFilter, dynamicStats);
    cache.set(staticFilter.idx, { staticFilter, dynamicStats, enriched });
    return enriched;
  });

  for (const idx of cache.keys()) {
    if (!seenIdx.has(idx)) cache.delete(idx);
  }

  return result;
}
