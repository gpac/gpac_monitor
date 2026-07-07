import { useState, useEffect } from 'react';
import { gpacService } from '@/services/gpacService';
import { SubscriptionType } from '@/types/communication/subscription';
import { useAppSelector } from '@/shared/hooks/redux';
import { selectLogsConfigString } from '@/shared/store/selectors/logs/logsConfigSelectors';
import { useServiceReady } from '@/shared/hooks/useServiceReady';

interface UseLogsOptions {
  enabled?: boolean;
}

export function useLogs(options: UseLogsOptions = {}) {
  const { enabled = true } = options;

  const [isSubscribed, setIsSubscribed] = useState(false);

  const { isReady } = useServiceReady({ enabled });
  const initialLogConfig = useAppSelector(selectLogsConfigString);

  useEffect(() => {
    if (!enabled || !isReady) {
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
          () => {},
        );

        if (isMounted) {
          setIsSubscribed(true);
        } else {
          unsubscribeFunc();
        }
      } catch (error) {
        console.error('[useLogs] Subscription failed:', error);
        if (isMounted) {
          setIsSubscribed(false);
        }
      }
    };

    setupSubscription();

    return () => {
      isMounted = false;
      setIsSubscribed(false);
    };
  }, [enabled, isReady, initialLogConfig]);

  return { isSubscribed };
}
