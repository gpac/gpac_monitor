import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Node, Edge } from '@xyflow/react';
import { throttle } from 'lodash';
import { GraphFilterData, SelectedEdgeInfo } from '@/types/domain/gpac';
import {
  createEdgesFromFilters,
  createNodesFromFilters,
} from '@/components/views/graph/utils/GraphOperations';
import { RootState } from '@/shared/store/types';

export interface GraphState {
  filters: GraphFilterData[];
  nodes: Node[];
  edges: Edge[];
  isLoading: boolean;
  error: string | null;
  redraw: boolean;
  selectedNodeId: string | null;
  lastUpdate: number;
  selectedFilterDetails: GraphFilterData | null;
  selectedEdge: SelectedEdgeInfo | null;
}

const initialState: GraphState = {
  filters: [],
  nodes: [],
  edges: [],
  isLoading: false,
  error: null,
  redraw: false,
  selectedNodeId: null,
  lastUpdate: Date.now(),
  selectedFilterDetails: null,
  selectedEdge: null,
};

const THROTTLE_INTERVAL = 500;

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
    updateGraphData: {
      reducer(state, action: PayloadAction<GraphFilterData[]>) {
        state.filters = [];
        state.nodes = [];
        state.edges = [];

        state.filters = action.payload;
        // Use topological ordering for proper graph layout
        const newNodes = createNodesFromFilters(action.payload, []);
        const newEdges = createEdgesFromFilters(action.payload, []);
        state.nodes.length = 0;
        state.edges.length = 0;
        newNodes.forEach((node) => state.nodes.push(node as any));
        newEdges.forEach((edge) => state.edges.push(edge as any));
        state.lastUpdate = Date.now();
      },
      prepare: throttle(
        (data: GraphFilterData[]) => ({
          payload: data,
          meta: { throttle: THROTTLE_INTERVAL },
        }),
        THROTTLE_INTERVAL,
      ),
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
        // Clear edge selection when node is selected
        state.selectedEdge = null;
      }
    },
    setSelectedEdge(state, action: PayloadAction<SelectedEdgeInfo | null>) {
      state.selectedEdge = action.payload;
      if (action.payload) {
        // Clear node selection when edge is selected
        state.selectedNodeId = null;
        state.selectedFilterDetails = null;
      }
    },
    setFilterDetails: (
      state,
      action: PayloadAction<GraphFilterData | null>,
    ) => {
      console.log('[GraphSlice] Updating filter details:', action.payload);
      state.selectedFilterDetails = action.payload;
    },

    clearFilterDetails: (state) => {
      state.selectedFilterDetails = null;
    },
    setSelectedFilterDetails: (
      state,
      action: PayloadAction<GraphFilterData>,
    ) => {
      state.selectedFilterDetails = action.payload;
      console.log('DETAILS DU FILTRE SÉLECTIONNÉ :', action.payload);
    },
  },
});
export const {
  setLoading,
  setError,
  updateGraphData,
  updateLayout,
  setSelectedNode,
  setSelectedEdge,
  setFilterDetails,
  clearFilterDetails,
  setSelectedFilterDetails,
} = graphSlice.actions;

export const selectFilterNameById = (state: RootState, filterId: string) => {
  const filter = state.graph.filters.find((f) => f.idx.toString() === filterId);
  return filter ? filter.name : '';
};

export default graphSlice.reducer;
