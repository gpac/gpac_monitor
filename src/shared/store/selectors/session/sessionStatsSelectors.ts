import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../types';

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
 * F3: Selector to detect stalled filters
 * A filter is stalled if:
 * - It's not EOS
 * - pck_sent hasn't changed since last update
 */
export const selectStalledFilters = createSelector(
  [selectSessionStats, selectPreviousSessionStats],
  (current, previous): Record<string, boolean> => {
    const stalled: Record<string, boolean> = {};

    Object.keys(current).forEach((id) => {
      const curr = current[id];
      const prev = previous[id];

      // Stalled = not EOS AND packets unchanged
      stalled[id] = !curr.is_eos && !!prev && curr.pck_sent === prev.pck_sent;
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
