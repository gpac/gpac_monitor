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
  const [isLoading, setIsLoading] = useState(false);

  const handleStatsUpdate = useCallback(
    (newStats: MonitoredFilterStats) => {
      setStats(newStats);
      setIsLoading(false);
    },
    [filterId],
  );

  useEffect(() => {
    if (filterId === undefined || !enabled || !gpacService.isConnected()) {
      setStats(null);
      setIsLoading(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    // Clear old data and set loading when starting subscription (batched = 1 re-render)
    setStats(null);
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
      } catch (error) {
        if (isMounted) {
          setStats(null);
          setIsLoading(false);
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
    isLoading,
    isSubscribed: !!stats,
  };
}
