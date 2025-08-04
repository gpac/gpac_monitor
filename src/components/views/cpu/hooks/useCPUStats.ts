import type { CPUStats } from '@/types/domain/system';
import { useState, useEffect, useCallback, useRef } from 'react';
import { gpacService } from '@/services/gpacService';
import { SubscriptionType } from '@/types/communication/subscription';

export function useCPUStats(enabled = true, interval = 150) {
  const [stats, setStats] = useState<CPUStats[]>([]);

  const statsRef = useRef<CPUStats[]>([]);
  statsRef.current = stats;

  const stableCallback = useRef((newStats: CPUStats) => {
    setStats((prev) => {
      const newStatsArray = [...prev.slice(-299), newStats];
      return newStatsArray;
    });
  });

  const handleStatsUpdate = useCallback((newStats: CPUStats) => {
    console.log('[useCPUStats] Received stats update:', {
      timestamp: newStats?.timestamp,
      processUsage: newStats?.process_cpu_usage,
      processMemory: newStats?.process_memory,
      nbCores: newStats?.nb_cores,
      currentStatsLength: statsRef.current.length
    });
    stableCallback.current(newStats);
  }, []);

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
        await gpacService.load();

        if (!isMounted) {
          return;
        }

        const unsubscribeFunc = await gpacService.subscribe(
          {
            type: SubscriptionType.CPU_STATS,
            interval,
          },
          (result) => {
            if (result.data && isMounted) {
              handleStatsUpdate(result.data as CPUStats);
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
  }, [enabled, interval, handleStatsUpdate]);

  return {
    stats,
    isSubscribed: stats.length > 0,
  };
}
