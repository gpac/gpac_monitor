import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { gpacService } from '../../../../../services/gpacService/gpacService';
import { removeSelectedFilter } from '../../../../../store/slices/multiFilterSlice';
import { setFilterDetails } from '../../../../../store/slices/graphSlice';
import { subscribeToSessionStats, unsubscribeFromSessionStats, resetSessionStats } from '../../../../../store/slices/sessionStatsSlice';
import { RootState } from '../../../../../store';

export const useMultiFilterMonitor = (componentId = 'multiFilterMonitor') => {
  const dispatch = useAppDispatch();
  const componentIdRef = useRef(componentId);

  const selectedFilters = useAppSelector(
    (state: RootState) => state.multiFilter.selectedFilters,
  );
  const isLoading = useAppSelector((state) => state.graph.isLoading);
  const sessionStats = useAppSelector((state: RootState) => state.sessionStats.sessionStats);
  const graphNodes = useAppSelector((state: RootState) => state.graph.nodes);
  const isSessionSubscribed = useAppSelector((state: RootState) => state.sessionStats.isSubscribed);

  // Subscribe/unsubscribe to session stats based on component lifecycle
  useEffect(() => {
    const id = componentIdRef.current;
    dispatch(subscribeToSessionStats(id));
    
    return () => {
      dispatch(unsubscribeFromSessionStats(id));
    };
  }, [dispatch]);

  // Reset session stats when graph changes (new session detected)
  useEffect(() => {
    if (graphNodes.length > 0) {
      // Check if this is a new session by detecting if current session stats 
      // have filters that no longer exist in the graph
      const currentNodeIndices = new Set(graphNodes.map(node => 
        typeof node.data.idx === 'number' ? node.data.idx.toString() : String(node.data.idx)
      ));
      const sessionFilterIndices = new Set(Object.keys(sessionStats));
      
      // If there are session stats for filters that don't exist in current graph, reset
      const hasStaleFilters = [...sessionFilterIndices].some(idx => !currentNodeIndices.has(idx));
      
      if (hasStaleFilters && sessionFilterIndices.size > 0) {
        console.log('Detected new session, resetting session stats');
        dispatch(resetSessionStats());
      }
    }
  }, [graphNodes, sessionStats, dispatch]);

  const handleCloseMonitor = useCallback(
    (filterIdx: string) => {
      // Use idx instead of generated id for consistency
      gpacService.unsubscribeFromFilter(filterIdx);
      dispatch(removeSelectedFilter(filterIdx));

      if (gpacService.getCurrentFilterId()?.toString() === filterIdx) {
        dispatch(setFilterDetails(null));
        gpacService.setCurrentFilterId(null);
      }
    },
    [dispatch],
  );

  return {
    selectedFilters,
    isLoading,
    handleCloseMonitor,
    sessionStats,
    isSessionSubscribed,
  };
};
