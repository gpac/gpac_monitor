import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { ChartDataPoint } from '../slices/monitoredFilterSlice';

/**
 * Base selector - get monitored filter state
 */
export const selectMonitoredFilterState = (state: RootState) =>
  state.monitoredFilter;

/**
 * Select network chart data for a specific filter
 * Returns {upload: [], download: []} or undefined if filter has no data
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
      upload: filterData.network.upload,
      download: filterData.network.download,
    };
  },
);

/**
 * Select upload data points for a specific filter
 */
export const selectFilterUploadData = createSelector(
  [selectFilterNetworkChartData],
  (networkData): ChartDataPoint[] => {
    return networkData?.upload || [];
  },
);

/**
 * Select download data points for a specific filter
 */
export const selectFilterDownloadData = createSelector(
  [selectFilterNetworkChartData],
  (networkData): ChartDataPoint[] => {
    return networkData?.download || [];
  },
);

/**
 * Select max points configuration
 */
export const selectMaxPoints = createSelector(
  [selectMonitoredFilterState],
  (monitoredFilterState) => monitoredFilterState.maxPoints,
);
