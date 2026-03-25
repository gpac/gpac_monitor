import { useDataSource } from '@/services/dataSource/DataSourceContext';
import { useCPUStatsHistory } from './useCPUStatsHistory';
import { useCPUStatsLive } from './useCPUStatsLive';
import type { CPUStatsResult } from './useCPUStatsHistory';

export function useCPUStats(enabled = true, maxPoints = 300): CPUStatsResult {
  const { mode } = useDataSource();
  const isHistory = mode === 'history';

  const history = useCPUStatsHistory(maxPoints);
  const live = useCPUStatsLive(!isHistory && enabled);

  return isHistory ? history : live;
}
