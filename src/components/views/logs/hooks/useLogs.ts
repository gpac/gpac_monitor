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

  const handleLogsUpdate = useCallback(
    (newLogs: GpacLogEntry[]) => {
      setLogs(newLogs.map((log) => ({ ...log })));
    },
    [],
  );

  useEffect(() => {
    if (!enabled) {
      if (logs.length > 0) {
        setLogs([]);
      }
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    const setupSubscription = async () => {
      try {
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
        } else {
          unsubscribeFunc();
        }
      } catch (error) {
        if (isMounted) {
          setLogs([]);
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
  }, [enabled, logLevel, handleLogsUpdate]);

  return {
    logs,
    isSubscribed: logs.length > 0,
  };
}