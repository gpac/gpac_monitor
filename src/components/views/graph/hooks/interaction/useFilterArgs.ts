import { useState } from 'react';
import { useGpacService } from '@/shared/hooks/useGpacService';
import { SubscriptionType } from '@/types/communication/subscription';
import { FilterArgument } from '@/types';

export const useFilterArgs = () => {
  const service = useGpacService();
  const [filterArgs, setFilterArgs] = useState<Map<number, FilterArgument[]>>(
    new Map(),
  );

  const requestFilterArgs = (filterIdx: number) => {
    service.subscribe(
      {
        type: SubscriptionType.FILTER_ARGS_DETAILS,
        filterIdx: filterIdx,
      },
      (result) => {
        console.log('Filter args received for idx:', filterIdx, result.data);
        setFilterArgs(
          (prev) =>
            new Map(prev.set(filterIdx, result.data as FilterArgument[])),
        );
      },
    );

    service.subscribeToFilterArgs(filterIdx);
  };

  const getFilterArgs = (filterIdx: number): FilterArgument[] | undefined => {
    return filterArgs.get(filterIdx);
  };

  const hasFilterArgs = (filterIdx: number): boolean => {
    return filterArgs.has(filterIdx);
  };

  return {
    requestFilterArgs,
    getFilterArgs,
    hasFilterArgs,
    filterArgs: filterArgs,
  };
};
