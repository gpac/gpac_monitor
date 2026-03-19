import { useDataSource } from '@/services/dataSource/DataSourceContext';
import { useSessionStatsHistory } from './useSessionStatsHistory';
import { useSessionStatsLive } from './useSessionStatsLive';
import type { SessionStatsResult } from './types';

export function useSessionStats(
  enabled = true,
  interval = 1000,
): SessionStatsResult {
  const { mode } = useDataSource();
  const isHistory = mode === 'history';

  const history = useSessionStatsHistory();
  const live = useSessionStatsLive(!isHistory && enabled, interval);

  return isHistory ? history : live;
}
