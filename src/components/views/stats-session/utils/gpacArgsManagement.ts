import { EnrichedFilterOverview } from '@/types/domain/gpac/model';
import { Dispatch } from '@reduxjs/toolkit';
import { setSelectedFilterForArgs } from '@/shared/store/slices/filterArgumentSlice';
import { setSelectedEdge } from '@/shared/store/slices/graphSlice';

/**
 * Creates a handler for opening filter settings in PropertiesPanel
 * Responsibility: Redux state update only
 * Note: The WebSocket subscription is handled by useFilterArgsSubscription hook
 */
export function createOpenPropertiesHandler(dispatch: Dispatch) {
  return (filter: EnrichedFilterOverview) => {
    // Clear edge selection (mutual exclusivity)
    dispatch(setSelectedEdge(null));

    // Update Redux state to show filter args in PropertiesPanel
    // The hook useFilterArgsSubscription will handle the WebSocket subscription
    dispatch(
      setSelectedFilterForArgs({ idx: filter.idx, name: filter.name }),
    );
  };
}
