import { useCallback, MutableRefObject } from 'react';
import { Node, Edge, NodeMouseHandler, EdgeMouseHandler } from '@xyflow/react';
import { Dispatch } from '@reduxjs/toolkit';

interface UseGraphHandlersProps {
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;
  localNodes: Node[];
  localEdges: Edge[];
  nodesRef: MutableRefObject<Node[]>;
  edgesRef: MutableRefObject<Edge[]>;
  setLocalNodes: (nodes: Node[]) => void;
  service: any;
  dispatch: Dispatch;
  onNodeClick?: (filterIdx: number) => void;
  onEdgeClick?: (filterIdx: number, ipidIdx: number) => void;
}

/**
 * Hook for managing graph interaction handlers
 * Handles node/edge changes and click events
 */
export const useGraphHandlers = ({
  onNodesChange,
  onEdgesChange,

  localEdges,
  nodesRef,
  edgesRef,
  onNodeClick,
  onEdgeClick,
}: UseGraphHandlersProps) => {
  // Handle node changes (position, selection, etc)
  const handleNodesChange = useCallback(
    (changes: any[]) => {
      
      onNodesChange(changes);


      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
     
          const nodeIndex = nodesRef.current.findIndex(
            (n) => n.id === change.id,
          );
          if (nodeIndex !== -1) {
            nodesRef.current[nodeIndex] = {
              ...nodesRef.current[nodeIndex],
              position: change.position,
            };
          }
        }
      });
    },
    [onNodesChange, nodesRef],
  );
  // Handle edge changes
  const handleEdgesChange = useCallback(
    (changes: any[]) => {
      onEdgesChange(changes);
      // Update edgesRef
      edgesRef.current = localEdges;
    },
    [onEdgesChange, localEdges, edgesRef],
  );

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      const filterIdx = parseInt(node.id);
      if (!isNaN(filterIdx)) {
        onNodeClick?.(filterIdx);
      }
    },
    [onNodeClick],
  );

  const handleEdgeClick: EdgeMouseHandler = useCallback(
    (_event, edge) => {
      // Parse edge ID: "sourceIdx-destIdx-ipidIdx"
      const parts = edge.id.split('-');
      if (parts.length === 3) {
        const filterIdx = parseInt(parts[1], 10);
        const ipidIdx = parseInt(parts[2], 10);

        if (!isNaN(filterIdx) && !isNaN(ipidIdx)) {
          onEdgeClick?.(filterIdx, ipidIdx);
        }
      }
    },
    [onEdgeClick],
  );

  return {
    handleNodesChange,
    handleEdgesChange,
    handleNodeClick,
    handleEdgeClick,
  };
};
