import { useState, useEffect } from 'react';
import { useGpacService } from '@/shared/hooks/useGpacService';
import { FilterArgument } from '@/types';

/**
 * Subscribe to filter arguments updates via UpdatableSubscribable
 * Returns live filter arguments when they arrive from server
 */
export const useFilterArgsSubscription = (filterIdx: number | undefined) => {
  const gpacService = useGpacService();
  const [args, setArgs] = useState<FilterArgument[]>([]);

  useEffect(() => {
    if (filterIdx === undefined) {
      setArgs([]);
      return;
    }

    // Subscribe to filter args updates via UpdatableSubscribable
    const unsubscribe = gpacService
      .getFilterArgsHandler()
      .subscribeToFilterArgsDetails(filterIdx, (newArgs) => {
        setArgs(newArgs);
      });

    return unsubscribe;
  }, [filterIdx, gpacService]);

  return args;
};
