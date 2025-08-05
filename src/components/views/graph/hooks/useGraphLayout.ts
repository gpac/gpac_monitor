import { useState, useCallback, useEffect, MutableRefObject } from 'react';
import { Node, Edge } from '@xyflow/react';
import dagre from 'dagre';
import { LayoutType, LayoutOptions } from '../utils/GraphLayout';

interface UseGraphLayoutProps {
  localNodes: Node[];
  localEdges: Edge[];
  setLocalNodes: (nodes: Node[]) => void;
  nodesRef: MutableRefObject<Node[]>;
  isApplyingLayout: MutableRefObject<boolean>;
}

const performDagreLayout = (nodes: Node[], edges: Edge[]): Node[] => {
  if (nodes.length === 0 || nodes.some((node) => !node.measured)) {
    return nodes;
  }

  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR' });

  nodes.forEach((node) => {
    g.setNode(node.id, {
      width: node.measured?.width || 200,
      height: node.measured?.height || 100,
    });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target, { points: [] });
  });

  const sinkNodes: string[] = [];
  const sourceNodes: string[] = [];

  nodes.forEach((node) => {
    const nodeData = node.data;
    if (nodeData && typeof nodeData.nb_opid === 'number' && nodeData.nb_opid === 0) {
      sinkNodes.push(node.id);
    }
    if (nodeData && typeof nodeData.nb_ipid === 'number' && nodeData.nb_ipid === 0) {
      sourceNodes.push(node.id);
    }
  });

  if (sinkNodes.length > 1) {
    for (let i = 0; i < sinkNodes.length - 1; i++) {
      g.setEdge(sinkNodes[i], sinkNodes[i + 1], { minlen: 0, weight: 0 });
    }
  }

  if (sourceNodes.length > 1) {
    for (let i = 0; i < sourceNodes.length - 1; i++) {
      g.setEdge(sourceNodes[i], sourceNodes[i + 1], { minlen: 0, weight: 0 });
    }
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const dagreNode = g.node(node.id);
    if (!dagreNode) return node;

    const { x, y, width, height } = dagreNode;
    return {
      ...node,
      position: {
        x: x - width / 2,
        y: y - height / 2,
      },
    };
  });
};

export const useGraphLayout = ({
  localNodes,
  localEdges,
  setLocalNodes,
  nodesRef,
  isApplyingLayout,
}: UseGraphLayoutProps) => {
  const [layoutOptions, setLayoutOptions] = useState<LayoutOptions>(() => {
    try {
      const savedLayout = localStorage.getItem('gpacMonitorLayout');
      if (savedLayout) {
        return JSON.parse(savedLayout) as LayoutOptions;
      }
    } catch (e) {}
    
    return {
      type: LayoutType.DAGRE,
      direction: 'LR',
      nodeSeparation: 150,
      rankSeparation: 250,
      respectExistingPositions: true,
    };
  });

  const applyLayoutWithNodes = useCallback((nodes: Node[]) => {
    if (nodes.length === 0) return;
    
    isApplyingLayout.current = true;
    const layoutedNodes = performDagreLayout(nodes, localEdges);
    
    setLocalNodes(layoutedNodes);
    nodesRef.current = layoutedNodes;
    
    setTimeout(() => {
      isApplyingLayout.current = false;
    }, 100);
  }, [localEdges, setLocalNodes, nodesRef, isApplyingLayout]);

  const applyLayout = useCallback(() => {
    applyLayoutWithNodes(localNodes);
  }, [localNodes, applyLayoutWithNodes]);

  const autoLayout = useCallback(() => {
    applyLayoutWithNodes(localNodes);
  }, [localNodes, applyLayoutWithNodes]);

  const handleLayoutChange = useCallback(
    (newOptions: LayoutOptions) => {
      if (localNodes.length === 0) return;
      if (localNodes.some((node) => !node.measured)) return;

      setLayoutOptions(newOptions);
      applyLayoutWithNodes(localNodes);
    },
    [localNodes, applyLayoutWithNodes],
  );

  useEffect(() => {
    try {
      if (layoutOptions.type) {
        localStorage.setItem('gpacMonitorLayout', JSON.stringify(layoutOptions));
      }
    } catch (e) {}
  }, [layoutOptions]);

  return {
    layoutOptions,
    handleLayoutChange,
    autoLayout,
    applyLayout,
  };
};