import { useMemo, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { gpacService } from '@/services/gpacService';
import { SubscriptionType } from '@/types/communication/subscription';
import { SessionFilterStatistics } from '../../../../../types/domain/gpac/filter-stats';
import { useServiceReady } from '@/shared/hooks/useServiceReady';
import { useDataSource } from '@/services/dataSource/DataSourceContext';
import { selectSessionStats } from '@/shared/store/selectors/session/sessionStatsSelectors';

export function useSessionStats(enabled = true, interval = 1000) {
  const { mode } = useDataSource();
  const isHistory = mode === 'history';

  // Read from Redux (live: populated via storeIntegration; history: via snapshotHydrator)
  const sessionStatsMap = useSelector(selectSessionStats);
  const stats = useMemo(
    () => Object.values(sessionStatsMap) as SessionFilterStatistics[],
    [sessionStatsMap],
  );

  const { isReady } = useServiceReady({ enabled });
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // In live mode: subscribe to trigger server subscription
  // Data flows to Redux via storeIntegration (onUpdateSessionStats callback)
  useEffect(() => {
    if (isHistory || !enabled || !isReady) return;

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
  }, [isHistory, enabled, isReady, interval]);

  return {
    stats,
    isSubscribed: stats.length > 0,
  };
}
