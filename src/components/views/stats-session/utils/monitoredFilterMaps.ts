import { EnrichedFilterOverview } from '@/types/domain/gpac/model';
import { FilterView } from '@/shared/store/slices/widgetsSlice';

/**
 * Get all monitored filters (inline + detached)
 */
export const getAllMonitoredFilters = (
  viewByFilter: Record<number, FilterView | undefined>,
  enrichedFilters: EnrichedFilterOverview[],
): Map<number, EnrichedFilterOverview> => {
  const monitoredIndexes = Object.entries(viewByFilter)
    .filter(([_, view]) => view !== null)
    .map(([idx]) => Number(idx));

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
  viewByFilter: Record<number, FilterView | undefined>,
): Map<number, EnrichedFilterOverview> => {
  return new Map(
    Array.from(monitoredFilters.entries()).filter(
      ([idx]) => viewByFilter[idx]?.mode === 'inline',
    ),
  );
};
