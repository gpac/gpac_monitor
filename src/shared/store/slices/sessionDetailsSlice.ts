import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CPUStats } from '@/types/domain/system';

export interface SessionDetailsState {
  commandLine: string | null;
  systemStats: CPUStats | null;
}

const initialState: SessionDetailsState = {
  commandLine: null,
  systemStats: null,
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
    },
    hydrateSessionDetails(
      state,
      action: PayloadAction<{ commandLine?: string | null; systemStats?: CPUStats }>
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
  hydrateSessionDetails,
  clearSessionDetails,
} = sessionDetailsSlice.actions;

export default sessionDetailsSlice.reducer;
