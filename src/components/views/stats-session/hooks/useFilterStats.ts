import type { MonitoredFilterStats } from '@/types/domain/gpac';
import { useState, useEffect, useCallback } from 'react';
import { gpacService } from '@/services/gpacService';
import { SubscriptionType } from '@/types/communication/subscription';

export function useFilterStats(
  filterId: number | undefined,
  enabled = true,
  interval = 1000,
) {
  const [stats, setStats] = useState<MonitoredFilterStats | null>(null);

  const handleStatsUpdate = useCallback(
    (newStats: MonitoredFilterStats) => {
      setStats(newStats);
    },
    [filterId],
  );

  useEffect(() => {
    if (filterId === undefined || !enabled || !gpacService.isConnected()) {
      setStats(null);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

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
      } catch (error) {
        if (isMounted) {
          setStats(null);
        }
      }
    };

    setupSubscription();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [filterId, enabled, interval, handleStatsUpdate]);

  return {
    stats,
    isSubscribed: !!stats,
  };
}
