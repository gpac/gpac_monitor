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
      const isSink = curr.nb_opid === 0;
      const hasTimeStampMetrics =
        curr.last_ts_sent !== undefined && prev.last_ts_sent !== undefined;

      const mediaProgress =
        !isSink && hasTimeStampMetrics
          ? timeFractionChanged(curr.last_ts_sent, prev.last_ts_sent)
          : false;

      // for filters consuming packets (sinks)
      const hasPacketMetrics =
        typeof curr.pck_done === 'number' && typeof prev.pck_done === 'number';
      const packetProgress =
        hasPacketMetrics && curr.pck_done !== prev.pck_done;

      const noProgress = !mediaProgress && !packetProgress;
      stalled[id] = !curr.is_eos && !isSink && noProgress;
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
