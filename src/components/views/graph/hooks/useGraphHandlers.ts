import { useCallback, MutableRefObject } from 'react';
import { Node, Edge } from '@xyflow/react';
import { useAppSelector, useAppDispatch } from '@/shared/hooks/redux';
import { GraphFilterData } from '@/types/domain/gpac';
import { 
  setSelectedFilterDetails,
  setSelectedNode
} from '@/shared/store/slices/graphSlice';
import { useGpacService } from '@/shared/hooks/useGpacService';
import { Dispatch } from '@reduxjs/toolkit';



interface UseGraphHandlersProps {
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;
  localNodes: Node[];
  localEdges: Edge[];
  nodesRef: MutableRefObject<Node[]>;
  edgesRef: MutableRefObject<Edge[]>;
  setLocalNodes: (nodes: Node[]) => void;
  service : any,
  dispatch: Dispatch
  
  
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
 
  
 
}: UseGraphHandlersProps) => {
  const dispatch = useAppDispatch();
  const service = useGpacService();

  // Get monitored filters from Redux
  const monitoredFilters = useAppSelector(
    (state) => state.multiFilter.selectedFilters
  );

  // Handle node changes (position, selection, etc)
  const handleNodesChange = useCallback(
    (changes: any[]) => {
      // Let React Flow handle its internal state updates
      onNodesChange(changes);
      
      // Then separately update our local reference for position changes
      changes.forEach(change => {
        if (change.type === 'position' && change.position) {
          // Update the specific node's position in our ref
          const nodeIndex = nodesRef.current.findIndex(n => n.id === change.id);
          if (nodeIndex !== -1) {
            nodesRef.current[nodeIndex] = {
              ...nodesRef.current[nodeIndex],
              position: change.position
            };
          }
        }
      });
    },
    [onNodesChange, nodesRef]
  );
  // Handle edge changes
  const handleEdgesChange = useCallback(
    (changes: any[]) => {
      onEdgesChange(changes);
      // Update edgesRef
      edgesRef.current = localEdges;
    },
    [onEdgesChange, localEdges, edgesRef]
  );

  // Handle node click event
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const nodeId = node.id;
      const nodeData = node.data;

      // Set selected filter in Redux
      dispatch(setSelectedFilterDetails(nodeData as unknown as GraphFilterData));
      
      // Update service with current filter
      service.setCurrentFilterId(parseInt(nodeId));
      service.getFilterDetails(parseInt(nodeId));



      // Set selected node in Redux
      dispatch(setSelectedNode(nodeId));
    },
    [dispatch, monitoredFilters, service]
  );
  
  return {
    handleNodesChange,
    handleEdgesChange,
    onNodeClick
  };
};