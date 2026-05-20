import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  PIDMetricSample,
  PIDGraphTarget,
} from '@/components/views/stats-session/types/pid';

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
  outband: ChartDataPoint[];
  inband: ChartDataPoint[];
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
  maxPoints: number; // Default: 600 (10 min at 1Hz)
  selectedPidTargets: PIDGraphTarget[];
  pidSamples: Record<string, PIDMetricSample[]>;
  maxPidSamples: number;
}

const initialState: MonitoredFilterState = {
  dataByFilter: {},
  maxPoints: 600,
  selectedPidTargets: [],
  pidSamples: {},
  maxPidSamples: 300,
};

const monitoredFilterSlice = createSlice({
  name: 'monitoredFilter',
  initialState,
  reducers: {
    /**
     * Add network data point (outband or inband)
     */
    addNetworkDataPoint: (
      state,
      action: PayloadAction<{
        filterId: string;
        type: 'outband' | 'inband';
        point: ChartDataPoint;
      }>,
    ) => {
      const { filterId, type, point } = action.payload;

      if (!state.dataByFilter[filterId]) {
        state.dataByFilter[filterId] = {};
      }

      if (!state.dataByFilter[filterId].network) {
        state.dataByFilter[filterId].network = {
          outband: [],
          inband: [],
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

    toggleSelectedPid: (state, action: PayloadAction<PIDGraphTarget>) => {
      const incoming = action.payload;
      const existingIndex = state.selectedPidTargets.findIndex(
        (existing) =>
          existing.filterIdx === incoming.filterIdx &&
          existing.direction === incoming.direction &&
          existing.pidIndex === incoming.pidIndex,
      );
      if (existingIndex >= 0) {
        state.selectedPidTargets.splice(existingIndex, 1);
      } else if (state.selectedPidTargets.length < 4) {
        state.selectedPidTargets.push(incoming);
      }
    },

    clearSelectedPids: (state) => {
      state.selectedPidTargets = [];
    },

    clearSelectedPidsByFilter: (state, action: PayloadAction<number>) => {
      state.selectedPidTargets = state.selectedPidTargets.filter(
        (target) => target.filterIdx !== action.payload,
      );
    },

    addPIDSample: (
      state,
      action: PayloadAction<{ key: string; sample: PIDMetricSample }>,
    ) => {
      const { key, sample } = action.payload;

      if (!state.pidSamples[key]) {
        state.pidSamples[key] = [];
      }

      const samples = state.pidSamples[key];
      const lastSample = samples[samples.length - 1];

      if (
        lastSample &&
        lastSample.sessionTimestampUs === sample.sessionTimestampUs &&
        lastSample.averageBitrate === sample.averageBitrate &&
        lastSample.bufferTime === sample.bufferTime &&
        lastSample.processTime === sample.processTime &&
        lastSample.processRate === sample.processRate &&
        lastSample.ts === sample.ts
      ) {
        return;
      }

      samples.push(sample);

      if (samples.length > state.maxPidSamples) {
        samples.shift();
      }
    },

    addPIDSamples: (
      state,
      action: PayloadAction<Array<{ key: string; sample: PIDMetricSample }>>,
    ) => {
      for (const { key, sample } of action.payload) {
        if (!state.pidSamples[key]) state.pidSamples[key] = [];
        const samples = state.pidSamples[key];
        const last = samples[samples.length - 1];
        if (
          last &&
          last.sessionTimestampUs === sample.sessionTimestampUs &&
          last.averageBitrate === sample.averageBitrate &&
          last.bufferTime === sample.bufferTime &&
          last.processTime === sample.processTime &&
          last.processRate === sample.processRate &&
          last.ts === sample.ts
        )
          continue;
        samples.push(sample);
        if (samples.length > state.maxPidSamples) samples.shift();
      }
    },

    clearPIDSamples: (state, action: PayloadAction<string>) => {
      delete state.pidSamples[action.payload];
    },

    clearAllPIDSamples: (state) => {
      state.pidSamples = {};
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
  toggleSelectedPid,
  clearSelectedPids,
  clearSelectedPidsByFilter,
  addPIDSample,
  addPIDSamples,
  clearPIDSamples,
  clearAllPIDSamples,
} = monitoredFilterSlice.actions;

export default monitoredFilterSlice.reducer;
