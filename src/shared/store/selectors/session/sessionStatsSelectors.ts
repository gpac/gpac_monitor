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
 * A filter is stalled if it's not EOS and shows no activity.
 * Activity is detected through ANY of these metrics:
 * - Timestamp progression (last_ts_sent)
 * - Packet activity (pck_sent OR pck_done)
 * - Bytes activity (bytes_sent OR bytes_done)
 */
export const selectStalledFilters = createSelector(
  [selectSessionStats, selectPreviousSessionStats],
  (current, previous): Record<string, boolean> => {
    const stalled: Record<string, boolean> = {};

    Object.keys(current).forEach((id) => {
      const curr = current[id];
      const prev = previous[id];

      // If filter is EOS (from PIDs or GPAC status), it's not stalled
      if (!prev || curr.is_eos || curr.status?.includes('EOS')) {
        stalled[id] = false;
        return;
      }

      // Check timestamp progression
      const timestampProgress =
        curr.last_ts_sent &&
        prev.last_ts_sent &&
        timeFractionChanged(curr.last_ts_sent, prev.last_ts_sent);

      // Check packet activity (sent OR done)
      const packetActivity =
        (typeof curr.pck_sent === 'number' &&
          typeof prev.pck_sent === 'number' &&
          curr.pck_sent !== prev.pck_sent) ||
        (typeof curr.pck_done === 'number' &&
          typeof prev.pck_done === 'number' &&
          curr.pck_done !== prev.pck_done);

      // Check bytes activity (sent OR done)
      const bytesActivity =
        (typeof curr.bytes_sent === 'number' &&
          typeof prev.bytes_sent === 'number' &&
          curr.bytes_sent !== prev.bytes_sent) ||
        (typeof curr.bytes_done === 'number' &&
          typeof prev.bytes_done === 'number' &&
          curr.bytes_done !== prev.bytes_done);

      // Filter is active if ANY metric shows progress
      const hasActivity = timestampProgress || packetActivity || bytesActivity;
      stalled[id] = !hasActivity;
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
