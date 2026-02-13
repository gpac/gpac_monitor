import { clearGraph } from '../slices/graphSlice';
import type { AppDispatch } from '../index';

/**
 * Clear all session data when reconnecting to a new GPAC session
 * This ensures a clean slate and prevents stale data from previous sessions
 */
export const clearAllSessionData = () => (dispatch: AppDispatch) => {
  // Clear graph data (nodes, edges, filters)
  dispatch(clearGraph());
};
