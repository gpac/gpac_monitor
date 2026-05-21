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

/**
 * Select max points configuration
 */
export const selectMaxPoints = createSelector(
  [selectMonitoredFilterState],
  (monitoredFilterState) => monitoredFilterState.maxPoints,
);
