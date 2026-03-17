import type { MonitoredFilterStats } from '@/types/domain/gpac';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { gpacService } from '@/services/gpacService';
import { SubscriptionType } from '@/types/communication/subscription';
import { useDataSource } from '@/services/dataSource/DataSourceContext';
import {
  selectSessionStats,
  selectFilterPids,
} from '@/shared/store/selectors/session/sessionStatsSelectors';

export function useFilterStats(
  filterId: number | undefined,
  enabled = true,
  interval = 1000,
) {
  const { mode } = useDataSource();
  const isHistory = mode === 'history';

  // History mode: dynamic stats from Redux, ipids/opids from Redux pidsByFilter
  const sessionStatsMap = useSelector(selectSessionStats);
  const filterKey = filterId?.toString() ?? '';
  const pids = useSelector((state: any) => selectFilterPids(state, filterKey));
  const historyStats = useMemo((): MonitoredFilterStats | null => {
    if (!isHistory || filterId === undefined) return null;
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
  }, [isHistory, filterId, filterKey, sessionStatsMap, pids]);

  const [liveStats, setLiveStats] = useState<MonitoredFilterStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStatsUpdate = useCallback(
    (newStats: MonitoredFilterStats) => {
      setLiveStats(newStats);
      setIsLoading(false);
    },
    [filterId],
  );

  useEffect(() => {
    if (
      isHistory ||
      filterId === undefined ||
      !enabled ||
      !gpacService.isConnected()
    ) {
      setLiveStats(null);
      setIsLoading(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    setLiveStats(null);
    setIsLoading(true);

    const setupSubscription = async () => {
      try {
        const unsubscribeFunc = await gpacService.subscribe(
          {
            type: SubscriptionType.FILTER_STATS,
            filterIdx: filterId,
            interval,
          },
          (result) => {
            if (result.data && isMounted) {
              handleStatsUpdate(result.data as MonitoredFilterStats);
            }
          },
        );

        if (isMounted) {
          unsubscribe = unsubscribeFunc;
        } else {
          unsubscribeFunc();
        }
      } catch {
        if (isMounted) {
          setLiveStats(null);
          setIsLoading(false);
        }
      }
    };

    setupSubscription();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [isHistory, filterId, enabled, interval, handleStatsUpdate]);

  const stats = isHistory ? historyStats : liveStats;

  return {
    stats,
    isLoading: isHistory ? false : isLoading,
    isSubscribed: !!stats,
  };
}
