import { useState, useEffect, useCallback } from 'react';
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
      console.log('[useLogs] Received logs:', newLogs.length, newLogs);
      setLogs(newLogs.map((log) => ({ ...log })));
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
        console.log('[useLogs] Loading service...');
        await gpacService.load();

        if (!isMounted) {
          return;
        }

        console.log('[useLogs] Subscribing to logs with level:', logLevel);
        const unsubscribeFunc = await gpacService.subscribe(
          {
            type: SubscriptionType.LOGS,
            logLevel,
          },
          (result) => {
            console.log('[useLogs] Received subscription result:', result);
            if (result.data && isMounted) {
              handleLogsUpdate(result.data as GpacLogEntry[]);
            }
          },
        );
        console.log('[useLogs] Subscription successful');

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

  return {
    logs,
    isSubscribed,
  };
}