import { useDataSource } from '@/services/dataSource/DataSourceContext';
import { useFilterStatsHistory } from './useFilterStatsHistory';
import { useFilterStatsLive } from './useFilterStatsLive';
import type { FilterStatsResult } from './types';

export function useFilterStats(
  filterId: number | undefined,
  enabled = true,
  interval = 1000,
): FilterStatsResult {
  const { mode } = useDataSource();
  const isHistory = mode === 'history';

  const history = useFilterStatsHistory(filterId);
  const live = useFilterStatsLive(filterId, !isHistory && enabled, interval);

  return isHistory ? history : live;
}
