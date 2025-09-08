import { useState, useEffect, useCallback, useDeferredValue } from 'react';
import { GpacLogEntry, GpacLogConfig } from '@/types/domain/gpac/log-types';
import { gpacService } from '@/services/gpacService';
import { SubscriptionType } from '@/types/communication/subscription';

interface UseLogsOptions {
  enabled?: boolean;
  logLevel?: GpacLogConfig;
  maxEntries?: number;
}

export function useLogs(options: UseLogsOptions = {}) {
  const {
    enabled = true,
    logLevel = 'all@warning',
   
  } = options;

  const [logs, setLogs] = useState<GpacLogEntry[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleLogsUpdate = useCallback(
    (newLogs: GpacLogEntry[]) => {
      console.log('[logs] Batch size:', newLogs.length);
      setLogs(currentLogs => {
        // Append new logs instead of replacing all
        const updatedLogs = [...currentLogs, ...newLogs.map((log) => ({ ...log }))];
        
        // Keep only last 500 logs for performance
        if (updatedLogs.length > 500) {
          return updatedLogs.slice(-500);
        }
        
        return updatedLogs;
      });
    },
    [],
  );

  useEffect(() => {
    if (!enabled) {
      if (logs.length > 0) {
        setLogs([]);
      }
      setIsSubscribed(false);
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
            type: SubscriptionType.LOGS,
            logLevel,
          },
          (result) => {
            if (result.data && isMounted) {
              handleLogsUpdate(result.data as GpacLogEntry[]);
            }
          },
        );


        if (isMounted) {
          unsubscribe = unsubscribeFunc;
          setIsSubscribed(true);
        } else {
          unsubscribeFunc();
        }
      } catch (error) {
        console.error('[useLogs] Subscription failed:', error);
        if (isMounted) {
          setLogs([]);
          setIsSubscribed(false);
        }
      }
    };

    setupSubscription();

    return () => {
      isMounted = false;
      setIsSubscribed(false);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [enabled, logLevel, handleLogsUpdate]);

  // Use useDeferredValue to smooth out rapid log updates and prevent UI blocking
  const deferredLogs = useDeferredValue(logs);

  return {
    logs: deferredLogs,
    isSubscribed,
  };
}