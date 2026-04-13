import { createAction } from '@reduxjs/toolkit';
import { GraphFilterData } from '@/types/domain/gpac';
import { clearGraph } from '../slices/graphSlice';
import type { AppDispatch } from '../index';

export const filtersUpdated = createAction<GraphFilterData[]>('graph/filtersUpdated');

/**
 * Clear all session data when reconnecting to a new GPAC session
 * This ensures a clean slate and prevents stale data from previous sessions
 */
export const clearAllSessionData = () => (dispatch: AppDispatch) => {
  // Clear graph data (nodes, edges, filters)
  dispatch(clearGraph());
};
