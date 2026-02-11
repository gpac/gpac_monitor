import { useCallback } from 'react';
import { Node, Edge, NodeChange, EdgeChange } from '@xyflow/react';

// =========================
//       NODES HANDLER
// =========================
interface NodesHandlerParams {
  onNodesChange: (changes: NodeChange[]) => void;
  localNodes: Node[];
  setLocalNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  nodesRef: React.MutableRefObject<Node[]>;
}

export function useHandleNodesChange({
  onNodesChange,
  localNodes,
  setLocalNodes,
  nodesRef,
}: NodesHandlerParams) {
  return useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);

      // Update local nodes with new positions
      setLocalNodes((prevNodes) =>
        prevNodes.map((node) => {
          const change = changes.find(
            (c) => c.type === 'position' && c.id === node.id,
          );
          return change?.type === 'position' && change.position
            ? { ...node, position: change.position }
            : node;
        }),
      );

      nodesRef.current = localNodes;
    },
    [onNodesChange, localNodes, setLocalNodes, nodesRef],
  );
}

// =========================
//       EDGES HANDLER
// =========================
interface EdgesHandlerParams {
  onEdgesChange: (changes: EdgeChange[]) => void;
  localEdges: Edge[];
  edgesRef: React.MutableRefObject<Edge[]>;
}

export function useHandleEdgesChange({
  onEdgesChange,
  localEdges,
  edgesRef,
}: EdgesHandlerParams) {
  return useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      // Update localEdges ref
      edgesRef.current = localEdges.map((edge) => ({ ...edge }));
    },
    [onEdgesChange, localEdges, edgesRef],
  );
}
