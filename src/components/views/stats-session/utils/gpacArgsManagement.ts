import { EnrichedFilterOverview } from '@/types/domain/gpac/model';
import { Dispatch } from '@reduxjs/toolkit';
import { setSidebarContent } from '@/shared/store/slices/layoutSlice';

/**
 * Creates a handler for opening filter settings in PropertiesPanel
 * Responsibility: Redux state update only
 * Note: The WebSocket subscription is handled by useFilterArgsSubscription hook
 */
export function createOpenPropertiesHandler(dispatch: Dispatch) {
  return (filter: EnrichedFilterOverview) => {
    // Set sidebar content to show filter args
    dispatch(
      setSidebarContent({
        type: 'filter-args',
        filterIdx: filter.idx,
        filterName: filter.name,
      }),
    );
  };
}
