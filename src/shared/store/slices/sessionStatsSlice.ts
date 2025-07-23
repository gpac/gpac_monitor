import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SessionFilterStats {
status :string,
  bytes_done: number;
  pck_sent: number;
  pck_done: number;
  time: number;
  idx: number;
  bytes_sent: number;
}

export type StatsMode = 'session' | 'filter';

export interface SessionStatsState {
  mode: StatsMode;
  sessionStats: Record<string, SessionFilterStats>;
  selectedFilterId: string | null;
  lastUpdate: number | null;
  isLoading: boolean;
  subscribedComponents: string[];
  isSubscribed: boolean;
}

const initialState: SessionStatsState = {
  mode: 'session',
  sessionStats: {},
  selectedFilterId: null,
  lastUpdate: null,
  isLoading: false,
  subscribedComponents: [],
  isSubscribed: false,
};

const sessionStatsSlice = createSlice({
  name: 'sessionStats',
  initialState,
  reducers: {
    updateSessionStats: (state, action: PayloadAction<SessionFilterStats[]>) => {
      const newStats: Record<string, SessionFilterStats> = {};
      action.payload.forEach(filter => {
        newStats[filter.idx.toString()] = filter;
      });
      state.sessionStats = newStats;
      state.lastUpdate = Date.now();
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
        (id) => id !== action.payload
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
    }
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
} = sessionStatsSlice.actions;

export default sessionStatsSlice.reducer;