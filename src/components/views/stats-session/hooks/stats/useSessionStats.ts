import { useState, useEffect, useCallback } from 'react';
import { gpacService } from '@/services/gpacService';
import { SubscriptionType } from '@/types/communication/subscription';
import { SessionFilterStatistics } from '../../../../../types/domain/gpac/filter-stats';
import { useServiceReady } from '@/shared/hooks/useServiceReady';

export function useSessionStats(enabled = true, interval = 1000) {
  const [stats, setStats] = useState<SessionFilterStatistics[]>([]);
  const { isReady } = useServiceReady({ enabled });

  const handleSessionStatsUpdate = useCallback(
    (newStats: SessionFilterStatistics[]) => {
      setStats(newStats.map((stat) => ({ ...stat })));
    },
    [],
  );

  useEffect(() => {
    if (!enabled || !isReady) {
      setStats([]);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    const setupSubscription = async () => {
      try {
        const unsubscribeFunc = await gpacService.subscribe(
          {
            type: SubscriptionType.SESSION_STATS,
            interval,
          },
          (result) => {
            if (result.data) {
              handleSessionStatsUpdate(
                result.data as SessionFilterStatistics[],
              );
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
          setStats([]);
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
  }, [enabled, isReady, interval, handleSessionStatsUpdate]);

  return {
    stats,
    isSubscribed: stats.length > 0,
  };
}
