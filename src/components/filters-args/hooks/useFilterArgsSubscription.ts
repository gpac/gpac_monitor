import { useState, useEffect } from 'react';
import { useGpacService } from '@/shared/hooks/useGpacService';
import { useAppSelector } from '@/shared/hooks/redux';
import { FilterArgument } from '@/types';
import { useDataMode } from '@/shared/hooks/useDataMode';
import { selectFilterArgs } from '@/shared/store/selectors/session';

/**
 * Subscribe to filter arguments updates via UpdatableSubscribable (live)
 * or read from Redux (history).
 */
export const useFilterArgsSubscription = (filterIdx: number | undefined) => {
  const gpacService = useGpacService();
  const { isHistory } = useDataMode();
  const cachedArgs = useAppSelector((state) =>
    filterIdx !== undefined
      ? selectFilterArgs(state, filterIdx.toString())
      : undefined,
  );
  const [args, setArgs] = useState<FilterArgument[]>([]);

  useEffect(() => {
    if (filterIdx === undefined) {
      setArgs([]);
      return;
    }

    if (isHistory) {
      setArgs((cachedArgs as unknown as FilterArgument[]) ?? []);
      return;
    }

    const unsubscribe = gpacService
      .getFilterArgsHandler()
      .subscribeToFilterArgsDetails(filterIdx, (newArgs) => {
        setArgs(newArgs);
      });

    return unsubscribe;
  }, [filterIdx, gpacService, isHistory, cachedArgs]);

  return args;
};
