import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  useNodesInitialized,
} from '@xyflow/react';
import {
  useGpacService,
  useAppDispatch,
  useToast,
  useSubscribedFilters,
} from '@/shared/hooks/index';
import {
  setSelectedNode,
  requestFilterOpen,
} from '@/shared/store/slices/graphSlice';

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
  const subscribedFilterIdxs = useSubscribedFilters();

  const subscribedSet = useMemo(
    () => new Set(subscribedFilterIdxs),
    [subscribedFilterIdxs],
  );

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

  // Handle node click to select filter and open overview
  const handleNodeSelect = useCallback(
    (filterIdx: number) => {
      dispatch(setSelectedNode(String(filterIdx)));
      dispatch(requestFilterOpen({ filterIdx, initialTab: 'overview' }));
    },
    [dispatch],
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
      onNodeClick: handleNodeSelect,
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
      if (nodesRef.current === nodes && edgesRef.current === edges) return;
      setLocalNodes(nodes);
      setLocalEdges(edges);

      nodesRef.current = nodes;
      edgesRef.current = edges;
    }
  }, [nodes, edges, setLocalNodes, setLocalEdges]);

  const [hasLayoutRun, setHasLayoutRun] = useState(false);
  const nodesInitialized = useNodesInitialized();

  // Annotate nodes with isMonitored property
  const annotatedNodes = useMemo(
    () =>
      localNodes.map((node) => {
        const filterIdx = node.data?.idx as number | undefined;
        const isMonitored =
          typeof filterIdx === 'number' && subscribedSet.has(filterIdx);

        return {
          ...node,
          data: {
            ...node.data,
            isMonitored,
          },
        };
      }),
    [localNodes, subscribedSet],
  );

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
    localNodes: annotatedNodes,
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
