import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

/**
 * Base selector - get monitored filter state
 */
export const selectMonitoredFilterState = (state: RootState) =>
  state.monitoredFilter;

/**
 * Select network chart data for a specific filter
 * Returns {outband: [], inband: []} or undefined if filter has no data
 */
export const selectFilterNetworkChartData = createSelector(
  [
    selectMonitoredFilterState,
    (_state: RootState, filterId: string) => filterId,
  ],
  (monitoredFilterState, filterId) => {
    const filterData = monitoredFilterState.dataByFilter[filterId];

    // Return undefined if no data for this filter yet
    if (!filterData?.network) {
      return undefined;
    }

    return {
      outband: filterData.network.outband,
      inband: filterData.network.inband,
    };
  },
);

export const selectFilterLastTaskTimeData = createSelector(
  [
    selectMonitoredFilterState,
    (_state: RootState, filterId: string) => filterId,
  ],
  (monitoredFilterState, filterId) =>
    monitoredFilterState.dataByFilter[filterId]?.lastTaskTime ?? [],
);

/**
 * Select max points configuration
 */
export const selectMaxPoints = createSelector(
  [selectMonitoredFilterState],
  (monitoredFilterState) => monitoredFilterState.maxPoints,
);

export const selectSelectedPidTargets = createSelector(
  [selectMonitoredFilterState],
  (state) => state.selectedPidTargets,
);

export const selectPidColorIndexByKey = createSelector(
  [selectSelectedPidTargets],
  (targets) =>
    Object.fromEntries(
      targets.map((target, index) => [
        `${target.filterIdx}:${target.direction}:${target.pidIndex}`,
        index,
      ]),
    ) as Record<string, number>,
);

export const selectPIDSamplesForTarget = createSelector(
  [selectMonitoredFilterState, (_state: RootState, key: string) => key],
  (state, key) => state.pidSamples[key] ?? [],
);

export const selectAllSelectedPidSamples = createSelector(
  [selectMonitoredFilterState, selectSelectedPidTargets],
  (state, targets) =>
    targets.map((target) => ({
      target,
      pidHistory:
        state.pidSamples[
          `${target.filterIdx}:${target.direction}:${target.pidIndex}`
        ] ?? [],
    })),
);

export const selectSelectedPidTargetsByFilter = createSelector(
  [
    selectSelectedPidTargets,
    (_state: RootState, filterIdx: number) => filterIdx,
  ],
  (targets, filterIdx) =>
    targets.filter((target) => target.filterIdx === filterIdx),
);

export const selectAllSelectedPidSamplesByFilter = createSelector(
  [
    selectMonitoredFilterState,
    (_state: RootState, filterIdx: number) => filterIdx,
  ],
  (state, filterIdx) =>
    state.selectedPidTargets
      .filter((target) => target.filterIdx === filterIdx)
      .map((target) => ({
        target,
        pidHistory:
          state.pidSamples[
            `${target.filterIdx}:${target.direction}:${target.pidIndex}`
          ] ?? [],
      })),
);
