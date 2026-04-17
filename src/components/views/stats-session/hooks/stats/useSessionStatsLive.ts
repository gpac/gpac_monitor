import { useMemo, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { gpacService } from '@/services/gpacService';
import { SubscriptionType } from '@/types/communication/subscription';
import { SessionFilterStatistics } from '@/types/domain/gpac/filter-stats';
import { useServiceReady } from '@/shared/hooks/connection/useServiceReady';
import { selectSessionStats } from '@/shared/store/selectors/session/sessionStatsSelectors';
import type { SessionStatsResult } from './types';

export function useSessionStatsLive(
  enabled = true,
  interval = 1000,
): SessionStatsResult {
  const sessionStatsMap = useSelector(selectSessionStats);
  const stats = useMemo(
    () => Object.values(sessionStatsMap) as SessionFilterStatistics[],
    [sessionStatsMap],
  );

  const { isReady } = useServiceReady({ enabled });
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled || !isReady) return;

    let isMounted = true;

    const setup = async () => {
      try {
        const unsub = await gpacService.subscribe(
          { type: SubscriptionType.SESSION_STATS, interval },
          () => {},
        );
        if (isMounted) {
          unsubscribeRef.current = unsub;
        } else {
          unsub();
        }
      } catch {}
    };

    setup();

    return () => {
      isMounted = false;
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, [enabled, isReady, interval]);

  return { stats, isSubscribed: stats.length > 0 };
}
