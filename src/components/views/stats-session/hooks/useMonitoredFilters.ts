import { useMemo } from 'react';
import { useAppSelector } from '@/shared/hooks/redux';
import { EnrichedFilterOverview } from '@/types/domain/gpac/model';
import {
  getAllMonitoredFilters,
  getInlineFilters,
} from '../utils/monitoredFilterMaps';

/**
 * Hook to get monitored filter maps from Redux state
 * Separates inline and all monitored filters
 */
export const useMonitoredFilters = (
  enrichedFilters: EnrichedFilterOverview[],
) => {
  const viewByFilter = useAppSelector((state) => state.widgets.viewByFilter);

  const monitoredFilterMap = useMemo(
    () => getAllMonitoredFilters(viewByFilter, enrichedFilters),
    [viewByFilter, enrichedFilters],
  );

  const inlineFilterMap = useMemo(
    () => getInlineFilters(monitoredFilterMap, viewByFilter),
    [monitoredFilterMap, viewByFilter],
  );

  return { monitoredFilterMap, inlineFilterMap };
};
