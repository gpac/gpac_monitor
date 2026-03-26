import { clearGraph } from '../slices/graphSlice';
import { clearSessionDetails } from '../slices/sessionDetailsSlice';
import { clearFilterPids } from '../slices/sessionStatsSlice';
import { clearFilterArgs } from '../slices/filterArgumentSlice';
import type { AppDispatch } from '../index';

/**
 * Clear all session data when reconnecting or switching back to live.
 * Single source of truth for Redux session reset.
 */
export const clearAllSessionData = () => (dispatch: AppDispatch) => {
  dispatch(clearGraph());
  dispatch(clearSessionDetails());
  dispatch(clearFilterPids());
  dispatch(clearFilterArgs());
};
