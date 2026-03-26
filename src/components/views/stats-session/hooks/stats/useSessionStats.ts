import { useDataMode } from '@/shared/hooks/useDataMode';
import { useSessionStatsHistory } from './useSessionStatsHistory';
import { useSessionStatsLive } from './useSessionStatsLive';
import type { SessionStatsResult } from './types';

export function useSessionStats(
  enabled = true,
  interval = 1000,
): SessionStatsResult {
  const { isHistory } = useDataMode();

  const history = useSessionStatsHistory();
  const live = useSessionStatsLive(!isHistory && enabled, interval);

  return isHistory ? history : live;
}
