import { useDataMode } from '@/shared/hooks/data/useDataMode';
import {
  useFilterPerformanceChartData,
  type FilterPerformanceChartOptions,
} from './useFilterPerformanceChartData';

export type UseBandwidthChartOptions = Omit<FilterPerformanceChartOptions, 'enabled'>;

/**
 * Facade: live mode dispatches new points, history mode reads store populated by replay.
 * Same pattern as useCPUStats → useCPUStatsLive / useCPUStatsHistory.
 */
export const useBandwidthChart = (options: UseBandwidthChartOptions) => {
  const { isHistory } = useDataMode();
  return useFilterPerformanceChartData({ ...options, enabled: !isHistory });
};
