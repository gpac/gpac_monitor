import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CPUStats } from '@/types/domain/system';

export interface SessionDetailsState {
  commandLine: string | null;
  systemStats: CPUStats | null;
  systemStatsHistory: CPUStats[];
}

const initialState: SessionDetailsState = {
  commandLine: null,
  systemStats: null,
  systemStatsHistory: [],
};

const sessionDetailsSlice = createSlice({
  name: 'sessionDetails',
  initialState,
  reducers: {
    setCommandLine(state, action: PayloadAction<string | null>) {
      state.commandLine = action.payload;
    },
    setSystemStats(state, action: PayloadAction<CPUStats>) {
      state.systemStats = action.payload;
      state.systemStatsHistory.push(action.payload);
    },
    resetSystemStatsHistory(state) {
      state.systemStatsHistory = [];
    },
    hydrateSessionDetails(
      state,
      action: PayloadAction<{
        commandLine?: string | null;
        systemStats?: CPUStats;
      }>,
    ) {
      const { commandLine, systemStats } = action.payload;
      if (commandLine !== undefined) state.commandLine = commandLine;
      if (systemStats !== undefined) state.systemStats = systemStats;
    },
    /** Bulk-push CPU stats (used by seek flush). */
    bulkAddSystemStats(state, action: PayloadAction<CPUStats[]>) {
      state.systemStatsHistory.push(...action.payload);
      const last = action.payload[action.payload.length - 1];
      if (last) state.systemStats = last;
    },
    clearSessionDetails() {
      return initialState;
    },
  },
});

export const {
  setCommandLine,
  setSystemStats,
  bulkAddSystemStats,
  resetSystemStatsHistory,
  hydrateSessionDetails,
  clearSessionDetails,
} = sessionDetailsSlice.actions;

export default sessionDetailsSlice.reducer;
