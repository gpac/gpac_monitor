import { EnrichedFilterOverview } from '@/types/domain/gpac/model';
import { ViewMode } from '@/shared/store/slices/widgetsSlice';

/**
 * Get all monitored filters (inline + detached)
 */
export const getAllMonitoredFilters = (
  viewModes: Record<number, ViewMode>,
  enrichedFilters: EnrichedFilterOverview[],
): Map<number, EnrichedFilterOverview> => {
  const monitoredIndexes = Object.keys(viewModes).map(Number);

  return new Map(
    monitoredIndexes
      .map((idx) => {
        const filter = enrichedFilters.find((f) => f.idx === idx);
        return filter ? [idx, filter] : null;
      })
      .filter(Boolean) as Array<[number, EnrichedFilterOverview]>,
  );
};

/**
 * Get inline-only filters from monitored filters
 */
export const getInlineFilters = (
  monitoredFilters: Map<number, EnrichedFilterOverview>,
  viewModes: Record<number, ViewMode>,
): Map<number, EnrichedFilterOverview> => {
  return new Map(
    Array.from(monitoredFilters.entries()).filter(
      ([idx]) => viewModes[idx] === 'inline',
    ),
  );
};
