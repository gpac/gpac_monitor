import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Node, Edge } from '@xyflow/react';
import { GraphFilterData } from '@/types/domain/gpac';
import {
  createEdgesFromFilters,
  createNodesFromFilters,
} from '@/utils/graph/GraphOperations';
import { RootState } from '@/shared/store/types';
import { filtersUpdated } from '@/shared/store/actions/globalActions';

export type InitialTabType = 'overview' | 'network' | 'inputs' | 'outputs';

export interface PendingFilterOpen {
  filterIdx: number;
  initialTab: InitialTabType;
}

export interface GraphState {
  filters: GraphFilterData[];
  nodes: Node[];
  edges: Edge[];
  isLoading: boolean;
  error: string | null;
  redraw: boolean;
  selectedNodeId: string | null;
  initialTab: InitialTabType | null;
  pendingFilterOpen: PendingFilterOpen | null;
  pidReconfiguredFilters: string[];
  argUpdatedFilters: string[];
  lastUpdate: number;
  pidReconfiguredCounts: Record<string, number>;
  argUpdatedCounts: Record<string, number>;
}

const initialState: GraphState = {
  filters: [],
  nodes: [],
  edges: [],
  isLoading: false,
  error: null,
  redraw: false,
  selectedNodeId: null,
  initialTab: null,
  pendingFilterOpen: null,
  pidReconfiguredFilters: [],
  argUpdatedFilters: [],
  lastUpdate: Date.now(),
  pidReconfiguredCounts: {},
  argUpdatedCounts: {},
};

const graphSlice = createSlice({
  name: 'graph',
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.isLoading = false;
    },

    updateLayout(
      state,
      action: PayloadAction<{ nodes: Node[]; edges: Edge[] }>,
    ) {
      // Update only the positions of existing nodes
      state.nodes = state.nodes.map((node) => {
        const updatedNode = action.payload.nodes.find((n) => n.id === node.id);
        return updatedNode ? { ...node, position: updatedNode.position } : node;
      });
      state.edges = action.payload.edges;
    },
    setSelectedNode(state, action: PayloadAction<string>) {
      if (state.selectedNodeId !== action.payload) {
        state.selectedNodeId = action.payload;
      }
    },
    clearSelectedNode(state) {
      state.selectedNodeId = null;
    },
    clearGraph(state) {
      state.filters = [];
      state.nodes = [];
      state.edges = [];
      state.selectedNodeId = null;
      state.error = null;
      state.isLoading = false;
      state.pendingFilterOpen = null;
      state.initialTab = null;
      state.pidReconfiguredCounts = {};
      state.argUpdatedCounts = {};
    },
    setInitialTab: (state, action: PayloadAction<InitialTabType | null>) => {
      state.initialTab = action.payload;
    },
    clearInitialTab: (state) => {
      state.initialTab = null;
    },
    /** Request to open a filter with a specific initial tab */
    requestFilterOpen: (state, action: PayloadAction<PendingFilterOpen>) => {
      state.pendingFilterOpen = action.payload;
      state.initialTab = action.payload.initialTab;
    },
    /** Clear the pending filter open request */
    clearPendingFilterOpen: (state) => {
      state.pendingFilterOpen = null;
    },
    markPidReconfigured(state, action: PayloadAction<number[]>) {
      for (const idx of action.payload) {
        const key = idx.toString();
        state.pidReconfiguredCounts[key] =
          (state.pidReconfiguredCounts[key] ?? 0) + 1;
      }
    },
    markArgUpdated(state, action: PayloadAction<number[]>) {
      for (const idx of action.payload) {
        const key = idx.toString();
        state.argUpdatedCounts[key] = (state.argUpdatedCounts[key] ?? 0) + 1;
      }
    },
    clearPidReconfigured(state, action: PayloadAction<number>) {
      delete state.pidReconfiguredCounts[action.payload.toString()];
    },
    clearArgUpdated(state, action: PayloadAction<number>) {
      delete state.argUpdatedCounts[action.payload.toString()];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(filtersUpdated, (state, action) => {
      state.filters = action.payload;
      state.nodes = createNodesFromFilters(
        action.payload,
        [],
      ) as typeof state.nodes;
      state.edges = createEdgesFromFilters(
        action.payload,
        [],
      ) as typeof state.edges;
      state.lastUpdate = Date.now();
    });
  },
});
export const {
  setLoading,
  setError,
  updateLayout,
  setSelectedNode,
  clearSelectedNode,
  clearGraph,
  setInitialTab,
  clearInitialTab,
  requestFilterOpen,
  clearPendingFilterOpen,
  markPidReconfigured,
  markArgUpdated,
  clearPidReconfigured,
  clearArgUpdated,
} = graphSlice.actions;

export const selectFilterNameById = (state: RootState, filterId: string) => {
  const filter = state.graph.filters.find((f) => f.idx.toString() === filterId);
  return filter ? filter.name : '';
};

export default graphSlice.reducer;
