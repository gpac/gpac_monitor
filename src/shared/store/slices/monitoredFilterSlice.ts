import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Generic data point for charts (time-series data)
 */
export interface ChartDataPoint {
  time: string;
  timestamp: number;
  value: number;
}

/**
 * Network chart data for a single filter
 */
interface NetworkChartData {
  upload: ChartDataPoint[];
  download: ChartDataPoint[];
}

/**
 * Chart data per filter - extensible for other metrics
 */
interface FilterChartData {
  network?: NetworkChartData;
}

/**
 * Monitored filter state - stores chart data per filter
 * Session-only (not persisted to localStorage)
 */
export interface MonitoredFilterState {
  dataByFilter: Record<string, FilterChartData>;
  maxPoints: number; // Default: 300 (5 min at 1Hz)
}

const initialState: MonitoredFilterState = {
  dataByFilter: {},
  maxPoints: 300,
};

const monitoredFilterSlice = createSlice({
  name: 'monitoredFilter',
  initialState,
  reducers: {
    /**
     * Add network data point (upload or download)
     */
    addNetworkDataPoint: (
      state,
      action: PayloadAction<{
        filterId: string;
        type: 'upload' | 'download';
        point: ChartDataPoint;
      }>,
    ) => {
      const { filterId, type, point } = action.payload;

      if (!state.dataByFilter[filterId]) {
        state.dataByFilter[filterId] = {};
      }

      if (!state.dataByFilter[filterId].network) {
        state.dataByFilter[filterId].network = {
          upload: [],
          download: [],
        };
      }

      const networkData = state.dataByFilter[filterId].network!;
      const dataArray = networkData[type];

      // Add new point
      dataArray.push(point);

      // Maintain sliding window - keep only last maxPoints
      if (dataArray.length > state.maxPoints) {
        dataArray.shift();
      }
    },

    /**
     * Clear all chart data for a specific filter
     */
    clearFilterData: (state, action: PayloadAction<string>) => {
      delete state.dataByFilter[action.payload];
    },

    /**
     * Reset all monitored filter data
     */
    resetAllData: (state) => {
      state.dataByFilter = {};
    },

    /**
     * Set max points for sliding window
     */
    setMaxPoints: (state, action: PayloadAction<number>) => {
      state.maxPoints = action.payload;
    },
  },
});

export const {
  addNetworkDataPoint,
  clearFilterData,
  resetAllData,
  setMaxPoints,
} = monitoredFilterSlice.actions;

export default monitoredFilterSlice.reducer;
