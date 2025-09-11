import {
  useState,
  useEffect,
  useCallback,
  useDeferredValue,
  useMemo,
} from 'react';
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
    maxEntries = 2000,
  } = options;

  const [logs, setLogs] = useState<GpacLogEntry[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleLogsUpdate = useCallback(
    (newLogs: GpacLogEntry[]) => {
      if (newLogs.length === 0) return;

      setLogs((currentLogs) => {
        const allLogs = currentLogs.concat(newLogs);

        // Keep only the latest maxEntries logs
        if (allLogs.length <= maxEntries) {
          return allLogs;
        }

        return allLogs.slice(-maxEntries);
      });
    },
    [maxEntries],
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

  const memoizedLogs = useMemo(() => logs, [logs]);
  const optimizedLogs = useDeferredValue(memoizedLogs);

  return {
    logs: optimizedLogs,
    isSubscribed,
  };
}
