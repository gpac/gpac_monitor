import { useDataMode } from '@/shared/hooks/data/useDataMode';
import { useCPUStatsHistory } from './useCPUStatsHistory';
import { useCPUStatsLive } from './useCPUStatsLive';
import type { CPUStatsResult } from './useCPUStatsHistory';

export function useCPUStats(enabled: boolean, interval: number): CPUStatsResult {
  const { isHistory } = useDataMode();

  const history = useCPUStatsHistory();
  const live = useCPUStatsLive(!isHistory && enabled, interval);

  return isHistory ? history : live;
}
