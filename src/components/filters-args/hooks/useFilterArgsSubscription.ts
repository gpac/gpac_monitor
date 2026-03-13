import { useState, useEffect } from 'react';
import { useGpacService } from '@/shared/hooks/useGpacService';
import { FilterArgument } from '@/types';
import { useDataSource } from '@/services/dataSource/DataSourceContext';

/**
 * Subscribe to filter arguments updates via UpdatableSubscribable (live)
 * or read from snapshot cache (history).
 */
export const useFilterArgsSubscription = (filterIdx: number | undefined) => {
  const gpacService = useGpacService();
  const { mode, snapshotCache } = useDataSource();
  const [args, setArgs] = useState<FilterArgument[]>([]);

  useEffect(() => {
    if (filterIdx === undefined) {
      setArgs([]);
      return;
    }

    if (mode === 'history') {
      const cached = snapshotCache?.get(filterIdx);
      setArgs((cached?.gpac_args as unknown as FilterArgument[]) ?? []);
      return;
    }

    const unsubscribe = gpacService
      .getFilterArgsHandler()
      .subscribeToFilterArgsDetails(filterIdx, (newArgs) => {
        setArgs(newArgs);
      });

    return unsubscribe;
  }, [filterIdx, gpacService, mode, snapshotCache]);

  return args;
};
