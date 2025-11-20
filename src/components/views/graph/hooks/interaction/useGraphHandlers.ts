import { useCallback, MutableRefObject } from 'react';
import { Node, Edge, NodeMouseHandler } from '@xyflow/react';
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

  return {
    handleNodesChange,
    handleEdgesChange,
    handleNodeClick,
  };
};
