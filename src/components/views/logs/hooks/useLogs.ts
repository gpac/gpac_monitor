import {
  useState,
  useEffect,
  useCallback,
  useDeferredValue,
  useMemo,
} from 'react';
import { GpacLogEntry } from '@/types/domain/gpac/log-types';
import { gpacService } from '@/services/gpacService';
import { SubscriptionType } from '@/types/communication/subscription';
import { useAppSelector } from '@/shared/hooks/redux';
import { selectLogsConfigString } from '@/shared/store/selectors/logs/logsConfigSelectors';

interface UseLogsOptions {
  enabled?: boolean;
  maxEntries?: number;
}

export function useLogs(options: UseLogsOptions = {}) {
  const { enabled = true, maxEntries = 2000 } = options;

  const [logs, setLogs] = useState<GpacLogEntry[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Get initial log configuration from store
  const initialLogConfig = useAppSelector(selectLogsConfigString);

  const handleLogsUpdate = useCallback(
    (newLogs: GpacLogEntry[]) => {
      if (newLogs.length === 0) return;

      setLogs((currentLogs) => {
        const allLogs = currentLogs.concat(newLogs);

        // Keep only the latest maxEntries logs
        if (allLogs.length <= maxEntries) {
          return allLogs;
        }

        const trimmed = allLogs.slice(-maxEntries);
        return trimmed;
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

    /*  let unsubscribe: (() => void) | null = null; */
    let isMounted = true;

    const setupSubscription = async () => {
      try {
        await gpacService.load();

        if (!isMounted) {
          return;
        }

        if (!isMounted) {
          return;
        }

        const unsubscribeFunc = await gpacService.subscribe(
          {
            type: SubscriptionType.LOGS,
            logLevel: initialLogConfig,
          },
          (result) => {
            if (result.data && isMounted) {
              handleLogsUpdate(result.data as GpacLogEntry[]);
            }
          },
        );

        if (isMounted) {
          /*   unsubscribe = unsubscribeFunc; */
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
      // NOTE: We deliberately do NOT call unsubscribe() here
      // This keeps the logs flowing to Redux store for sidebar counts
      // Logs subscription will only be cleaned up on session end or app close
    };
  }, [enabled, handleLogsUpdate, initialLogConfig, logs.length]);

  const memoizedLogs = useMemo(() => logs, [logs]);
  const optimizedLogs = useDeferredValue(memoizedLogs);

  return {
    logs: optimizedLogs,
    isSubscribed,
  };
}
