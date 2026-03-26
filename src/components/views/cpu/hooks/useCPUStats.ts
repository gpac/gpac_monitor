import { useDataMode } from '@/shared/hooks/useDataMode';
import { useCPUStatsHistory } from './useCPUStatsHistory';
import { useCPUStatsLive } from './useCPUStatsLive';
import type { CPUStatsResult } from './useCPUStatsHistory';

export function useCPUStats(enabled = true, maxPoints = 300): CPUStatsResult {
  const { isHistory } = useDataMode();

  const history = useCPUStatsHistory(maxPoints);
  const live = useCPUStatsLive(!isHistory && enabled);

  return isHistory ? history : live;
}
