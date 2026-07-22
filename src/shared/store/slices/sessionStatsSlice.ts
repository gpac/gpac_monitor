import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TimeFraction } from '../../../types/domain/gpac/model';
import type { PIDproperties } from '@/types/domain/gpac/filter-stats';
import type { MetricDefinitionMap } from '@/utils/metrics/metricDefinitionParser';

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
  last_task_time?: number;
  idx: number;
  bytes_sent: number;
  is_eos?: boolean;
  last_ts_sent?: TimeFraction | null;
}

export type StatsMode = 'session' | 'filter';

export interface SessionStatsPayload {
  stats: SessionFilterStats[];
  ts_us?: number;
}

export interface SessionStatsState {
  mode: StatsMode;
  sessionStats: Record<string, SessionFilterStats>;
  previousSessionStats: Record<string, SessionFilterStats>;
  pidsByFilter: Record<string, FilterPids>;
  selectedFilterId: string | null;
  lastUpdate: number | null;
  lastUpdateUs: number | null;
  sessionStartUs: number | null;
  isLoading: boolean;
  subscribedComponents: string[];
  isSubscribed: boolean;
  metricDefinitions: MetricDefinitionMap;
}

const initialState: SessionStatsState = {
  mode: 'session',
  sessionStats: {},
  previousSessionStats: {},
  pidsByFilter: {},
  selectedFilterId: null,
  lastUpdate: null,
  lastUpdateUs: null,
  sessionStartUs: null,
  isLoading: false,
  subscribedComponents: [],
  isSubscribed: false,
  metricDefinitions: {},
};

const sessionStatsSlice = createSlice({
  name: 'sessionStats',
  initialState,
  reducers: {
    updateSessionStats: (state, action: PayloadAction<SessionStatsPayload>) => {
      const { stats, ts_us } = action.payload;

      state.previousSessionStats = state.sessionStats;

      const newStats: Record<string, SessionFilterStats> = {};
      stats.forEach((filter) => {
        const prevFilter = state.sessionStats[filter.idx.toString()];
        const preservedEOS = filter.is_eos || prevFilter?.is_eos || false;
        newStats[filter.idx.toString()] = { ...filter, is_eos: preservedEOS };
      });
      state.sessionStats = newStats;
      state.lastUpdate = Date.now();
      state.lastUpdateUs = ts_us ?? null;
      if (state.sessionStartUs === null && ts_us != null) {
        state.sessionStartUs = ts_us;
      }
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
      state.lastUpdateUs = null;
      state.sessionStartUs = null;
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

      if (!state.isSubscribed) {
        state.sessionStats = {};
        state.lastUpdate = null;
        state.lastUpdateUs = null;
        state.sessionStartUs = null;
      }
    },

    resetSessionStats: (state) => {
      state.sessionStats = {};
      state.lastUpdate = null;
      state.lastUpdateUs = null;
      state.sessionStartUs = null;
      state.isLoading = false;
    },

    setFilterPids: (
      state,
      action: PayloadAction<Record<string, FilterPids>>,
    ) => {
      for (const [idx, pids] of Object.entries(action.payload)) {
        if (!state.pidsByFilter[idx]) {
          state.pidsByFilter[idx] = pids;
          continue;
        }
        const existing = state.pidsByFilter[idx];
        for (const dir of ['ipids', 'opids'] as const) {
          if (!pids[dir]) continue;
          const merged: Record<string, PIDproperties> = {};
          for (const [key, pid] of Object.entries(pids[dir]!)) {
            merged[key] = existing[dir]?.[key]
              ? { ...existing[dir]![key], ...pid }
              : pid;
          }
          existing[dir] = merged;
        }
      }
    },

    clearFilterPids: (state) => {
      state.pidsByFilter = {};
    },

    setMetricDefinitions: (
      state,
      action: PayloadAction<MetricDefinitionMap>,
    ) => {
      state.metricDefinitions = action.payload;
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
  setMetricDefinitions,
} = sessionStatsSlice.actions;

export default sessionStatsSlice.reducer;
