import { useMemo } from 'react';
import { useAppSelector } from '@/shared/hooks/redux';
import { selectFilterViewModes } from '@/shared/store/selectors/widgets/widgetsSelectors';
import { EnrichedFilterOverview } from '@/types/domain/gpac/model';
import {
  getAllMonitoredFilters,
  getInlineFilters,
} from '../../utils/monitoredFilterMaps';

/**
 * Hook to get monitored filter maps from Redux state
 * Separates inline and all monitored filters
 */
export const useMonitoredFilters = (
  enrichedFilters: EnrichedFilterOverview[],
) => {
  const viewModes = useAppSelector(selectFilterViewModes);

  const monitoredFilterMap = useMemo(
    () => getAllMonitoredFilters(viewModes, enrichedFilters),
    [viewModes, enrichedFilters],
  );

  const inlineFilterMap = useMemo(
    () => getInlineFilters(monitoredFilterMap, viewModes),
    [monitoredFilterMap, viewModes],
  );

  return { monitoredFilterMap, inlineFilterMap };
};
