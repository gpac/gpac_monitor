import { useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import { GraphFilterData } from '@/types/index';
import { isValidFilterData } from '@/utils/filterMonitorUtils';

// =========================
//       NODES HANDLER
// =========================
interface NodesHandlerParams {
  onNodesChange: (changes: any[]) => void;
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
    (changes: any[]) => {
      onNodesChange(changes);

      // Update local nodes with new positions
      setLocalNodes((prevNodes) =>
        prevNodes.map((node) => {
          const change = changes.find((c) => c.id === node.id);
          return change && change.position
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
  onEdgesChange: (changes: any[]) => void;
  localEdges: Edge[];
  edgesRef: React.MutableRefObject<Edge[]>;
}

export function useHandleEdgesChange({
  onEdgesChange,
  localEdges,
  edgesRef,
}: EdgesHandlerParams) {
  return useCallback(
    (changes: any[]) => {
      onEdgesChange(changes);
      // Update localEdges ref
      edgesRef.current = localEdges.map((edge) => ({ ...edge }));
    },
    [onEdgesChange, localEdges, edgesRef],
  );
}

// =========================
//    ON NODE CLICK HANDLER
// =========================
interface OnNodeClickParams {
  dispatch: Function;
  service: any;
  setSelectedNode: (nodeId: string) => { payload: string; type: string };
  setSelectedFilterDetails: (data: GraphFilterData) => {
    payload: GraphFilterData;
    type: string;
  };
}

export function useOnNodeClick({
  dispatch,
  service,
  setSelectedNode,
  setSelectedFilterDetails,
}: OnNodeClickParams) {
  return useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const nodeId = node.id;
      const nodeData = node.data;

      // Type guard to ensure nodeData is valid GraphFilterData
      if (isValidFilterData(nodeData)) {
        dispatch(setSelectedFilterDetails(nodeData));
        service.setCurrentFilterId(parseInt(nodeId));
        service.getFilterDetails(parseInt(nodeId));
      } else {
        console.warn('Invalid node data:', nodeData);
      }

      dispatch(setSelectedNode(nodeId));
    },
    [dispatch, service, setSelectedFilterDetails, setSelectedNode],
  );
}
