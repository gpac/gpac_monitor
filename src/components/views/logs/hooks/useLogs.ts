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
import { useServiceReady } from '@/shared/hooks/useServiceReady';

interface UseLogsOptions {
  enabled?: boolean;
  maxEntries?: number;
}

export function useLogs(options: UseLogsOptions = {}) {
  const { enabled = true, maxEntries = 2000 } = options;

  const [logs, setLogs] = useState<GpacLogEntry[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const { isReady } = useServiceReady({ enabled });
  const initialLogConfig = useAppSelector(selectLogsConfigString);

  const handleLogsUpdate = useCallback(
    (newLogs: GpacLogEntry[]) => {
      if (newLogs.length === 0) return;

      setLogs((currentLogs) => {
        const allLogs = currentLogs.concat(newLogs);

        if (allLogs.length <= maxEntries) {
          return allLogs;
        }

        return allLogs.slice(-maxEntries);
      });
    },
    [maxEntries],
  );

  useEffect(() => {
    if (!enabled || !isReady) {
      if (logs.length > 0) {
        setLogs([]);
      }
      setIsSubscribed(false);
      return;
    }

    let isMounted = true;

    const setupSubscription = async () => {
      try {
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
    };
  }, [enabled, isReady, handleLogsUpdate, initialLogConfig, logs.length]);

  const memoizedLogs = useMemo(() => logs, [logs]);
  const optimizedLogs = useDeferredValue(memoizedLogs);

  return {
    logs: optimizedLogs,
    isSubscribed,
  };
}
