import { useState, useEffect, useCallback } from 'react';
import { gpacService } from '@/services/gpacService';
import { SubscriptionType } from '@/types/communication/subscription';
import { SessionFilterStatistics } from '@/types/domain/gpac/model';

export function useSessionStats(enabled = true, interval = 1000) {
  const [stats, setStats] = useState<SessionFilterStatistics[]>([]);

  const handleSessionStatsUpdate = useCallback(
    (newStats: SessionFilterStatistics[]) => {
      console.log(
        '[useSessionStats] Received stats update:',
        newStats.length,
        'filters',
      );

      setStats(newStats.map(stat => ({ ...stat })));

    },
    [],
  );

  useEffect(() => {
    if (!enabled) {
      if (stats.length > 0) {
        setStats([]);
      }
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    const setupSubscription = async () => {
      try {
        console.log(
          '[useSessionStats] Setting up subscription, enabled:',
          enabled,
          'interval:',
          interval,
        );
        await gpacService.load();

        if (!isMounted) {
          console.log('[useSessionStats] Component unmounted during setup');
          return;
        }

        console.log('[useSessionStats] Subscribing to SESSION_STATS');
        const unsubscribeFunc = await gpacService.subscribe(
          {
            type: SubscriptionType.SESSION_STATS,
            interval,
          },
          (result) => {
            console.log(
              '[useSessionStats] Received subscription callback:',
              result,
            );
            if (result.data) {
              handleSessionStatsUpdate(
                result.data as SessionFilterStatistics[],
              );
            } else {
              console.log('[useSessionStats] No data in result:', result);
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
  }, [enabled, interval, handleSessionStatsUpdate]);

  return {
    stats,
    isSubscribed: stats.length > 0,
  };
}
