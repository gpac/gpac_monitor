import { EnrichedFilterOverview } from '@/types/domain/gpac/model';
import { gpacService } from '@/services/gpacService';
import { Dispatch } from '@reduxjs/toolkit';
import { setSelectedNode } from '@/shared/store/slices/widgetsSlice';

/**
 * Creates a handler for opening filter properties panel
 * Responsibility: GPAC arguments request and display
 */
export function createOpenPropertiesHandler(dispatch: Dispatch) {
  return (filter: EnrichedFilterOverview) => {
    // Open properties panel
    dispatch(
      setSelectedNode({ idx: filter.idx, name: filter.name, gpac_args: [] }),
    );
    // Request filter arguments
    gpacService.subscribeToFilterArgs(filter.idx);
  };
}
