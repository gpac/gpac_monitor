import type { MonitoredFilterStats } from '@/types/domain/gpac';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { gpacService } from '@/services/gpacService';
import { SubscriptionType } from '@/types/communication/subscription';
import { useDataSource } from '@/services/dataSource/DataSourceContext';
import { selectSessionStats } from '@/shared/store/selectors/session/sessionStatsSelectors';

export function useFilterStats(
  filterId: number | undefined,
  enabled = true,
  interval = 1000,
) {
  const { mode, snapshotCache } = useDataSource();
  const isHistory = mode === 'history';

  // History mode: dynamic stats from Redux, static ipids/opids from snapshot cache
  const sessionStatsMap = useSelector(selectSessionStats);
  const historyStats = useMemo((): MonitoredFilterStats | null => {
    if (!isHistory || filterId === undefined) return null;
    const reduxStats = sessionStatsMap[filterId.toString()];
    const cached = snapshotCache?.get(filterId);
    if (!reduxStats && !cached) return null;
    return {
      idx: filterId,
      status: reduxStats?.status ?? '',
      bytes_done: reduxStats?.bytes_done ?? 0,
      bytes_sent: reduxStats?.bytes_sent ?? 0,
      pck_sent: reduxStats?.pck_sent ?? 0,
      pck_done: reduxStats?.pck_done ?? 0,
      time: reduxStats?.time ?? 0,
      nb_ipid: reduxStats?.nb_ipid ?? cached?.nb_ipid ?? 0,
      nb_opid: reduxStats?.nb_opid ?? cached?.nb_opid ?? 0,
      ipids: cached?.ipids,
      opids: cached?.opids,
    };
  }, [isHistory, filterId, sessionStatsMap, snapshotCache]);

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
    if (isHistory || filterId === undefined || !enabled || !gpacService.isConnected()) {
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
