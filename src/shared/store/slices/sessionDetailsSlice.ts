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
    clearSessionDetails() {
      return initialState;
    },
  },
});

export const {
  setCommandLine,
  setSystemStats,
  resetSystemStatsHistory,
  hydrateSessionDetails,
  clearSessionDetails,
} = sessionDetailsSlice.actions;

export default sessionDetailsSlice.reducer;
