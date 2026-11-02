import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MonitorIntervals {
  SESSION_STATS: number;
  FILTER_STATS: number;
  CPU_STATS: number;
}

interface MonitorConfigState {
  intervals: MonitorIntervals;
  serverProtocolVersion: number | undefined;
}

// Fallback only, used until the server's monitor_config message arrives.
// Source of truth: server/config/live.config.js UPDATE_INTERVALS.
const initialState: MonitorConfigState = {
  intervals: { SESSION_STATS: 1000, FILTER_STATS: 1000, CPU_STATS: 500 },
  serverProtocolVersion: undefined,
};

const monitorConfigSlice = createSlice({
  name: 'monitorConfig',
  initialState,
  reducers: {
    setMonitorConfig: (state, action: PayloadAction<MonitorIntervals>) => {
      state.intervals = action.payload;
    },
    setServerProtocolVersion: (
      state,
      action: PayloadAction<number | undefined>,
    ) => {
      state.serverProtocolVersion = action.payload;
    },
  },
});

export const { setMonitorConfig, setServerProtocolVersion } =
  monitorConfigSlice.actions;
export default monitorConfigSlice.reducer;
