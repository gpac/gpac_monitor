import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TimeFraction } from '../../../types/domain/gpac/model';
import type { PIDproperties } from '@/types/domain/gpac/filter-stats';

export interface FilterPids {
  ipids?: Record<string, PIDproperties>;
  opids?: Record<string, PIDproperties>;
}

export interface SessionFilterStats {
  status: string;
  bytes_done: number;
  pck_sent: number;
  pck_done: number;
  nb_opid: number;
  nb_ipid: number;
  time: number;
  idx: number;
  bytes_sent: number;
  is_eos?: boolean;
  last_ts_sent?: TimeFraction | null;
}

export type StatsMode = 'session' | 'filter';

export interface SessionStatsState {
  mode: StatsMode;
  sessionStats: Record<string, SessionFilterStats>;
  previousSessionStats: Record<string, SessionFilterStats>;
  pidsByFilter: Record<string, FilterPids>;
  selectedFilterId: string | null;
  lastUpdate: number | null;
  lastUpdateUs: number | null;
  isLoading: boolean;
  subscribedComponents: string[];
  isSubscribed: boolean;
}

const initialState: SessionStatsState = {
  mode: 'session',
  sessionStats: {},
  previousSessionStats: {},
  pidsByFilter: {},
  selectedFilterId: null,
  lastUpdate: null,
  lastUpdateUs: null,
  isLoading: false,
  subscribedComponents: [],
  isSubscribed: false,
};

const sessionStatsSlice = createSlice({
  name: 'sessionStats',
  initialState,
  reducers: {
    updateSessionStats: (
      state,
      action: PayloadAction<
        SessionFilterStats[] | { stats: SessionFilterStats[]; ts_us?: number }
      >,
    ) => {
      const isArray = Array.isArray(action.payload);
      const stats = isArray
        ? (action.payload as SessionFilterStats[])
        : (action.payload as { stats: SessionFilterStats[]; ts_us?: number })
            .stats;
      const ts_us = isArray
        ? undefined
        : (action.payload as { stats: SessionFilterStats[]; ts_us?: number })
            .ts_us;

      // Save previous stats for stall detection
      state.previousSessionStats = { ...state.sessionStats };

      const newStats: Record<string, SessionFilterStats> = {};
      stats.forEach((filter) => {
        const prevFilter = state.sessionStats[filter.idx.toString()];

        // Preserve is_eos once it's been set to true
        const preservedEOS = filter.is_eos || prevFilter?.is_eos || false;

        newStats[filter.idx.toString()] = {
          ...filter,
          is_eos: preservedEOS,
        };
      });
      state.sessionStats = newStats;
      state.lastUpdate = Date.now();
      state.lastUpdateUs = ts_us ?? null;
      state.isLoading = false;
    },

    switchToSessionMode: (state) => {
      state.mode = 'session';
      state.selectedFilterId = null;
      state.isLoading = true;
    },

    switchToFilterMode: (state, action: PayloadAction<string>) => {
      state.mode = 'filter';
      state.selectedFilterId = action.payload;
      state.isLoading = true;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    clearSessionStats: (state) => {
      state.sessionStats = {};
      state.lastUpdate = null;
    },

    subscribeToSessionStats: (state, action: PayloadAction<string>) => {
      if (!state.subscribedComponents.includes(action.payload)) {
        state.subscribedComponents.push(action.payload);
      }
      state.isSubscribed = state.subscribedComponents.length > 0;
    },

    unsubscribeFromSessionStats: (state, action: PayloadAction<string>) => {
      state.subscribedComponents = state.subscribedComponents.filter(
        (id) => id !== action.payload,
      );
      state.isSubscribed = state.subscribedComponents.length > 0;

      // Clear stats if no components are subscribed
      if (!state.isSubscribed) {
        state.sessionStats = {};
        state.lastUpdate = null;
      }
    },

    resetSessionStats: (state) => {
      state.sessionStats = {};
      state.lastUpdate = null;
      state.isLoading = false;
    },

    setFilterPids: (
      state,
      action: PayloadAction<Record<string, FilterPids>>,
    ) => {
      state.pidsByFilter = action.payload;
    },

    clearFilterPids: (state) => {
      state.pidsByFilter = {};
    },
  },
});

export const {
  updateSessionStats,
  switchToSessionMode,
  switchToFilterMode,
  setLoading,
  clearSessionStats,
  subscribeToSessionStats,
  unsubscribeFromSessionStats,
  resetSessionStats,
  setFilterPids,
  clearFilterPids,
} = sessionStatsSlice.actions;

export default sessionStatsSlice.reducer;
