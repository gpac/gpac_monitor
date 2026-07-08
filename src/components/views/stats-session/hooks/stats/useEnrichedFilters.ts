import { useMemo, useRef } from 'react';
import type {
  GraphFilterData,
  SessionFilterStatistics,
} from '@/types/domain/gpac';
import type { EnrichedFilterOverview } from '@/types/domain/gpac/model';
import {
  enrichFiltersWithStatsStable,
  type EnrichmentCache,
} from '../../utils/filterEnrichment';

/**
 * Enriches static filters with session stats, keeping a stable reference
 * per filter idx when its data didn't change, and freezing the result
 * while resizing (no recompute, no blank grid).
 */
export function useEnrichedFilters(
  staticFilters: GraphFilterData[],
  sessionStats: SessionFilterStatistics[],
  isResizing: boolean,
): EnrichedFilterOverview[] {
  const cacheRef = useRef<EnrichmentCache>(new Map());
  const lastResultRef = useRef<EnrichedFilterOverview[]>([]);

  return useMemo(() => {
    if (staticFilters.length === 0) {
      lastResultRef.current = [];
      return lastResultRef.current;
    }
    if (isResizing) return lastResultRef.current;

    const enriched = enrichFiltersWithStatsStable(
      cacheRef.current,
      staticFilters,
      sessionStats,
    );
    lastResultRef.current = enriched;
    return enriched;
  }, [staticFilters, sessionStats, isResizing]);
}
