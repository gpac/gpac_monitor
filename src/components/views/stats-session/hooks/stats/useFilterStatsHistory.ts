import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { MonitoredFilterStats } from '@/types/domain/gpac';
import {
  selectSessionStats,
  selectFilterPids,
} from '@/shared/store/selectors/session/sessionStatsSelectors';
import type { RootState } from '@/shared/store/types';
import type { FilterStatsResult } from './types';

export function useFilterStatsHistory(
  filterId: number | undefined,
): FilterStatsResult {
  const sessionStatsMap = useSelector(selectSessionStats);
  const filterKey = filterId?.toString() ?? '';
  const pids = useSelector((state: RootState) =>
    selectFilterPids(state, filterKey),
  );

  const stats = useMemo((): MonitoredFilterStats | null => {
    if (filterId === undefined) return null;
    const reduxStats = sessionStatsMap[filterKey];
    if (!reduxStats && !pids) return null;
    return {
      idx: filterId,
      status: reduxStats?.status ?? '',
      bytes_done: reduxStats?.bytes_done ?? 0,
      bytes_sent: reduxStats?.bytes_sent ?? 0,
      pck_sent: reduxStats?.pck_sent ?? 0,
      pck_done: reduxStats?.pck_done ?? 0,
      time: reduxStats?.time ?? 0,
      nb_ipid: reduxStats?.nb_ipid ?? 0,
      nb_opid: reduxStats?.nb_opid ?? 0,
      ipids: pids?.ipids,
      opids: pids?.opids,
    };
  }, [filterId, filterKey, sessionStatsMap, pids]);

  return { stats, isLoading: false, isSubscribed: !!stats };
}
