import { EnrichedFilterOverview } from '@/types/domain/gpac/model';
import { FilterView } from '@/shared/store/slices/widgetsSlice';

/**
 * Derive monitored filters map from viewByFilter state
 * Includes both inline and detached filters
 */
export const deriveMonitoredFilterMap = (
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
 * Derive inline-only filters map from monitored filters
 */
export const deriveInlineFilterMap = (
  monitoredFilters: Map<number, EnrichedFilterOverview>,
  viewByFilter: Record<number, FilterView | undefined>,
): Map<number, EnrichedFilterOverview> => {
  return new Map(
    Array.from(monitoredFilters.entries()).filter(
      ([idx]) => viewByFilter[idx]?.mode === 'inline',
    ),
  );
};
