import { useDataMode } from '@/shared/hooks/useDataMode';
import { useFilterStatsHistory } from './useFilterStatsHistory';
import { useFilterStatsLive } from './useFilterStatsLive';
import type { FilterStatsResult } from './types';

export function useFilterStats(
  filterId: number | undefined,
  enabled = true,
  interval = 1000,
): FilterStatsResult {
  const { isHistory } = useDataMode();

  const history = useFilterStatsHistory(filterId);
  const live = useFilterStatsLive(filterId, !isHistory && enabled, interval);

  return isHistory ? history : live;
}
