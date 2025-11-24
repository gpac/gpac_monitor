import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../types';
import { TimeFraction } from '../../../../types/domain/gpac/model';

// Helper to compare TimeFraction values
const timeFractionChanged = (
  curr: TimeFraction | null | undefined,
  prev: TimeFraction | null | undefined,
): boolean => {
  if (!curr || !prev) return false;
  return curr.num !== prev.num || curr.den !== prev.den;
};

// Base selector
export const selectSessionStatsState = (state: RootState) => state.sessionStats;

export const selectSessionStats = createSelector(
  [selectSessionStatsState],
  (sessionStatsState) => sessionStatsState.sessionStats,
);

export const selectPreviousSessionStats = createSelector(
  [selectSessionStatsState],
  (sessionStatsState) => sessionStatsState.previousSessionStats,
);

/**
 * A filter is stalled if:
 * - It's not EOS
 * - No media progress detected:
 *   - For source/process filters: last_ts_sent unchanged
 *   - For sink filters (vout/aout): pck_done unchanged
 */
export const selectStalledFilters = createSelector(
  [selectSessionStats, selectPreviousSessionStats],
  (current, previous): Record<string, boolean> => {
    const stalled: Record<string, boolean> = {};

    Object.keys(current).forEach((id) => {
      const curr = current[id];
      const prev = previous[id];

      if (!prev || curr.is_eos) {
        stalled[id] = false;
        return;
      }

      // Check media timestamp progress (for filters that send packets)
      const tsChanged = timeFractionChanged(curr.last_ts_sent, prev.last_ts_sent);

      // Check packet consumption (for sink filters like vout/aout)
      const pckDoneChanged = curr.pck_done !== prev.pck_done;

      // Stalled = no media progress AND no packet consumption
      stalled[id] = !tsChanged && !pckDoneChanged;
    });

    return stalled;
  },
);

/**
 * Selector to check if a specific filter is stalled
 */
export const selectIsFilterStalled = (filterId: string) =>
  createSelector([selectStalledFilters], (stalledFilters) => {
    return stalledFilters[filterId] ?? false;
  });
