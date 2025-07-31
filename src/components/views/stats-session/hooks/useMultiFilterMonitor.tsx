import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { gpacService } from '@/services/gpacService';
import { removeSelectedFilter } from '@/shared/store/slices/multiFilterSlice';
import { setFilterDetails } from '@/shared/store/slices/graphSlice';
import { RootState } from '@/shared/store';
import {
  GraphFilterData,
  SessionFilterStatistics,
} from '@/types/domain/gpac/model';
import { useSessionStats } from './useSessionStats';


interface MultiFilterMonitorState {
  isLoading: boolean;
  handleCloseMonitor: (filterIdx: string) => void;
  sessionStats: SessionFilterStatistics[];
  isSessionSubscribed: boolean;
  staticFilters: GraphFilterData[];
  sessionStatsData: SessionFilterStatistics[];
}

export const useMultiFilterMonitor = (
  isDashboardActive: boolean = true,
): MultiFilterMonitorState => {
  const dispatch = useAppDispatch();

  const { stats: sessionStatsData } = useSessionStats(isDashboardActive, 1000);


  const isLoading = useAppSelector((state) => state.graph.isLoading);
  const isSessionSubscribed = useAppSelector(
    (state: RootState) => state.sessionStats.isSubscribed,
  );
  const staticFilters = useAppSelector(
    (state: RootState) => state.graph.filters,
  );

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
    isLoading,
    handleCloseMonitor,
    sessionStats: sessionStatsData,
    isSessionSubscribed,
    staticFilters,
    sessionStatsData,
  };
};
