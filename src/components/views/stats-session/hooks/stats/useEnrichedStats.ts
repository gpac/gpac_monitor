import { useState, useEffect, useRef, useMemo } from 'react';
import { GpacNodeData } from '@/types/domain/gpac/model';
import { enrichedStatsWorkerService } from '@/services/workers/enrichedStatsWorkerService';
import { EnrichedFilterData } from '@/workers/enrichedStatsWorker';
import { useAppSelector } from '@/shared/hooks/redux';
import { selectMetricDefinitions } from '@/shared/store/selectors';

export function useEnrichedStats(rawFilters: GpacNodeData[]) {
  const [enrichedFilters, setEnrichedFilters] = useState<EnrichedFilterData[]>(
    [],
  );
  const isProcessingRef = useRef(false);
  const definitions = useAppSelector(selectMetricDefinitions);

  // Stabilize rawFilters by creating a serialized key
  const filtersKey = useMemo(() => {
    return rawFilters
      .map(
        (filter) => `${filter.idx}:${filter.bytes_done}:${filter.status ?? ''}`,
      )
      .join('|');
  }, [rawFilters]);

  useEffect(() => {
    if (rawFilters.length === 0) {
      setEnrichedFilters([]);
      return;
    }

    if (isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;

    enrichedStatsWorkerService.setDefinitions(definitions);
    enrichedStatsWorkerService.enrichStats(rawFilters);

    const unsubscribe = enrichedStatsWorkerService.subscribe((enriched) => {
      setEnrichedFilters(enriched);
      isProcessingRef.current = false;
    });

    return () => {
      unsubscribe();
      isProcessingRef.current = false;
    };
  }, [filtersKey]); // Use stable key instead of rawFilters

  return enrichedFilters;
}
