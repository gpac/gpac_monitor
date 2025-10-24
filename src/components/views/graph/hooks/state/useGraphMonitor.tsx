import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  useNodesInitialized,
} from '@xyflow/react';
import { useToast } from '@/shared/hooks/useToast';
import { useGpacService } from '@/shared/hooks/useGpacService';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import {
  detachFilterTab,
  selectActiveWidgets,
} from '@/shared/store/slices/widgetsSlice';
import { WidgetType } from '@/types/ui/widget';

// Modularized hooks
import { useGraphLayout } from '../layout/useGraphLayout';
import { useGraphState } from './useGraphState';
import { useGraphConnection } from '../connection/useGraphConnection';
import { useGraphHandlers } from '../interaction/useGraphHandlers';
import { useGraphNotifications } from '../interaction/useGraphNotifications';
import { useFilterArgs } from '../interaction/useFilterArgs';

const useGraphMonitor = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const service = useGpacService();

  // Refs to track component state
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const isApplyingLayout = useRef(false);

  // Local state for nodes and edges with React Flow's state management
  const [localNodes, setLocalNodes, onNodesChange] = useNodesState<Node>([]);
  const [localEdges, setLocalEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const {
    nodes,
    edges,
    isLoading,
    error,
    connectionError,
    setConnectionError,
  } = useGraphState(nodesRef, edgesRef);

  const { layoutOptions, handleLayoutChange, autoLayout, applyLayout } =
    useGraphLayout({
      localNodes,
      localEdges,
      setLocalNodes,
      nodesRef,
      isApplyingLayout,
    });

  const { retryConnection } = useGraphConnection({
    setConnectionError,
  });

  const { getFilterArgs, hasFilterArgs } = useFilterArgs();

  const activeWidgets = useAppSelector(selectActiveWidgets);

  // Handle node click to create detached widget
  const handleNodeTabDetach = useCallback(
    (filterIdx: number) => {
      // Check if filter already has a detached widget
      const isAlreadyDetached = activeWidgets.some(
        (w) =>
          w.type === WidgetType.FILTERSESSION &&
          w.isDetached === true &&
          w.detachedFilterIdx === filterIdx,
      );

      if (isAlreadyDetached) {
        // Filter already visible in detached view, ignore
        return;
      }

      // Find the node to get filter name
      const node = localNodes.find((n) => parseInt(n.id) === filterIdx);
      const filterName =
        typeof node?.data?.name === 'string'
          ? node.data.name
          : `Filter ${filterIdx}`;

      // Dispatch action to create detached widget
      dispatch(detachFilterTab({ filterIdx, filterName }));
    },
    [dispatch, localNodes, activeWidgets],
  );

  const { handleNodesChange, handleEdgesChange, handleNodeClick } =
    useGraphHandlers({
      onNodesChange,
      onEdgesChange,
      localNodes,
      localEdges,
      nodesRef,
      edgesRef,
      setLocalNodes,
      service,
      dispatch,
      onNodeClick: handleNodeTabDetach,
    });

  // Use notification system
  useGraphNotifications({
    nodes,
    error,
    isLoading,
    toast,
  });

  // Effect to update local nodes and edges from Redux
  useEffect(() => {
    // Only update if not currently applying a layout
    if ((nodes.length > 0 || edges.length > 0) && !isApplyingLayout.current) {
      setLocalNodes(nodes);
      setLocalEdges(edges);

      nodesRef.current = nodes;
      edgesRef.current = edges;
    }
  }, [nodes, edges, setLocalNodes, setLocalEdges]);

  const [hasLayoutRun, setHasLayoutRun] = useState(false);
  const nodesInitialized = useNodesInitialized();

  // Reset layout flag when nodes change (new graph data)
  useEffect(() => {
    if (nodes.length > 0 && nodes.length !== nodesRef.current.length) {
      setHasLayoutRun(false);
    }
  }, [nodes.length]);

  // Auto-layout hook using useNodesInitialized with boolean guard
  useEffect(() => {
    if (hasLayoutRun) {
      return;
    }
    if (!nodesInitialized) {
      return;
    }
    if (localNodes.length === 0) {
      return;
    }
    if (localNodes.some((node) => !node.measured)) {
      return;
    }
    if (!localNodes.some((n) => n.data && n.data.name)) {
      return;
    }

    // Run the layout and set guard flag
    autoLayout();
    setHasLayoutRun(true);
  }, [nodesInitialized, localNodes, hasLayoutRun, autoLayout]);

  const triggerLayout = () => {
    setHasLayoutRun(false);
    autoLayout();
  };

  return {
    isLoading,
    connectionError,
    retryConnection,
    localNodes,
    localEdges,
    handleNodesChange,
    handleEdgesChange,
    handleNodeClick,
    layoutOptions,
    handleLayoutChange,
    autoLayout,
    applyLayout,
    triggerLayout,
    getFilterArgs,
    hasFilterArgs,
  };
};

export default useGraphMonitor;
