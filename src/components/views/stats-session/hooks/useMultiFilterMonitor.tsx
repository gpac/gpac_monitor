import { useCallback } from 'react';
import { useAppSelector } from '@/shared/hooks/redux';
import { gpacService } from '@/services/gpacService';
import { RootState } from '@/shared/store';
import {
  GraphFilterData,
  SessionFilterStatistics,
} from '@/types/domain/gpac/index';
import { useSessionStats } from './stats/useSessionStats';

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
  const { stats: sessionStatsData } = useSessionStats(isDashboardActive, 1000);

  const isLoading = useAppSelector((state) => state.graph.isLoading);
  const isSessionSubscribed = useAppSelector(
    (state: RootState) => state.sessionStats.isSubscribed,
  );
  const staticFilters = useAppSelector(
    (state: RootState) => state.graph.filters,
  );

  const handleCloseMonitor = useCallback((filterIdx: string) => {
    gpacService.unsubscribeFromFilter(filterIdx);

    if (gpacService.getCurrentFilterId()?.toString() === filterIdx) {
      gpacService.setCurrentFilterId(null);
    }
  }, []);

  return {
    isLoading,
    handleCloseMonitor,
    sessionStats: sessionStatsData,
    isSessionSubscribed,
    staticFilters,
    sessionStatsData,
  };
};
