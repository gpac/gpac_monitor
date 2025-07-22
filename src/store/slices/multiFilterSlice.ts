import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GpacNodeData } from '../../types/domain/gpac';

export interface MonitoredFilter {
  id: string; // Keep for backward compatibility, but will use nodeData.idx as primary key
  nodeData: GpacNodeData;
}

export interface MultifilterState {
  selectedFilters: MonitoredFilter[];
  maxMonitors: number;
  activeSubscriptions: string[];
}

const initialState: MultifilterState = {
  selectedFilters: [],
  maxMonitors: 6,
  activeSubscriptions: [],
};

const multiFilterSlice = createSlice({
  name: 'multiFilter',
  initialState,
  reducers: {
    addSelectedFilter(state, action: PayloadAction<MonitoredFilter>) {
      if (state.selectedFilters.length >= state.maxMonitors) {
        return;
      }

      const filterIdx = action.payload.nodeData.idx.toString();
      // Prevent duplicates by checking idx instead of id
      if (state.selectedFilters.some((filter) => filter.nodeData.idx.toString() === filterIdx)) {
        return;
      }
      state.selectedFilters.push({
        id: filterIdx, // Use idx as id for consistency
        nodeData: action.payload.nodeData,
      });
      state.activeSubscriptions.push(filterIdx);
    },
    removeSelectedFilter: (state, action: PayloadAction<string>) => {
      // Remove by idx for consistency
      state.selectedFilters = state.selectedFilters.filter(
        (f) => f.nodeData.idx.toString() !== action.payload,
      );
      state.activeSubscriptions = state.activeSubscriptions.filter(
        (idx) => idx !== action.payload,
      );
    },

    setSelectedFilters: (state, action: PayloadAction<MonitoredFilter[]>) => {
      state.selectedFilters = action.payload;
      state.activeSubscriptions = action.payload.map((f) => f.id);
    },

    updateFilterData: (
      state,
      action: PayloadAction<{ idx: number; data: GpacNodeData }>,
    ) => {
      // Find by idx instead of id
      const index = state.selectedFilters.findIndex(
        (f) => f.nodeData.idx === action.payload.idx,
      );
      if (index !== -1) {
        state.selectedFilters[index].nodeData = action.payload.data;
      }
    },

    setMaxMonitors: (state, action: PayloadAction<number>) => {
      state.maxMonitors = Math.max(1, Math.min(12, action.payload));
      // If reducing max monitors, remove excess monitors from the end
      if (state.selectedFilters.length > state.maxMonitors) {
        state.selectedFilters = state.selectedFilters.slice(
          0,
          state.maxMonitors,
        );
        state.activeSubscriptions = state.activeSubscriptions.slice(
          0,
          state.maxMonitors,
        );
      }
    },
  },
});

export const {
  addSelectedFilter,
  removeSelectedFilter,
  setSelectedFilters,
  updateFilterData,
  setMaxMonitors,
} = multiFilterSlice.actions;

export default multiFilterSlice.reducer;
