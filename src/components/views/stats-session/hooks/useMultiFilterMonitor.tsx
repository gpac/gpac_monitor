import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { gpacService } from '@/services/gpacService';
import { removeSelectedFilter } from '@/shared/store/slices/multiFilterSlice';
import { setFilterDetails } from '@/shared/store/slices/graphSlice';
import { subscribeToSessionStats, unsubscribeFromSessionStats } from '@/shared/store/slices/sessionStatsSlice';
import { RootState } from '@/shared/store';
import { GraphFilterData } from '@/types/domain/gpac/model';
import { MonitoredFilter } from '@/shared/store/slices/multiFilterSlice';
import { SessionFilterStats } from '@/shared/store/slices/sessionStatsSlice';

interface MultiFilterMonitorState {
  selectedFilters: MonitoredFilter[];
  isLoading: boolean;
  handleCloseMonitor: (filterIdx: string) => void;
  sessionStats: Record<string, SessionFilterStats>;
  isSessionSubscribed: boolean;
  staticFilters: GraphFilterData[];
}

export const useMultiFilterMonitor = (componentId = 'multiFilterMonitor'): MultiFilterMonitorState => {
  const dispatch = useAppDispatch();
  const componentIdRef = useRef(componentId);
  const [mountCount, setMountCount] = useState(0);

  const selectedFilters = useAppSelector(
    (state: RootState) => state.multiFilter.selectedFilters,
  );
  const isLoading = useAppSelector((state) => state.graph.isLoading);
  const sessionStats = useAppSelector((state: RootState) => state.sessionStats.sessionStats);
  const isSessionSubscribed = useAppSelector((state: RootState) => state.sessionStats.isSubscribed);
  const staticFilters = useAppSelector((state: RootState) => state.graph.filters);

  // Subscribe/unsubscribe to session stats based on component lifecycle
  useEffect(() => {
    setMountCount((prev) => prev + 1);
    console.log(`[useMultiFilterMonitor] Montage #${mountCount + 1}, isSessionSubscribed:`, isSessionSubscribed);
    const id = componentIdRef.current;
    dispatch(subscribeToSessionStats(id));
    // Log pour vérifier l'abonnement
    console.log(`[useMultiFilterMonitor] Tentative d'abonnement pour le composant:`, id);
    
    return () => {
      console.log(`[useMultiFilterMonitor] Démontage, isSessionSubscribed:`, isSessionSubscribed);
      dispatch(unsubscribeFromSessionStats(id));
    };
  }, [dispatch]);

  const handleCloseMonitor = useCallback(
    (filterIdx: string) => {

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
    staticFilters,
  };
};
