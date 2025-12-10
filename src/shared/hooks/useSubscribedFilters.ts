import { useEffect, useState } from 'react';
import { useGpacService } from './useGpacService';

/**
 * Return idx filter list with FILTER_STATS active subscription.
 */

export const useSubscribedFilters = (): number[] => {
  const service = useGpacService();

  const [subscribedFilterIdxs, setSubscribedFilterIdxs] = useState<number[]>(
    () => service.filterSubscriptions.getSnapshot().subscribedFilterIdxs,
  );

  useEffect(() => {
    const unsubscribe = service.filterSubscriptions.subscribe(
      (data) => {
        setSubscribedFilterIdxs(data.subscribedFilterIdxs);
      },
      {
        debounce: 150,
        immediate: true,
      },
    );

    return unsubscribe;
  }, [service]);

  return subscribedFilterIdxs;
};
