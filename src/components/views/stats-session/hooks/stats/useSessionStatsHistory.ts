import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { SessionFilterStatistics } from '@/types/domain/gpac/filter-stats';
import { selectSessionStats } from '@/shared/store/selectors/session/sessionStatsSelectors';
import type { SessionStatsResult } from './types';

export function useSessionStatsHistory(): SessionStatsResult {
  const sessionStatsMap = useSelector(selectSessionStats);
  const stats = useMemo(
    () => Object.values(sessionStatsMap) as SessionFilterStatistics[],
    [sessionStatsMap],
  );

  return { stats, isSubscribed: stats.length > 0 };
}
