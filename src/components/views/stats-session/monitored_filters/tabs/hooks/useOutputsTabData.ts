import { useMemo } from 'react';
import type { FilterStatsResponse } from '@/types/domain/gpac/filter-stats';
import type { PIDWithIndex } from '../../../types';
import { getGlobalStatus } from '@/utils/gpac';

export const useOutputsTabData = (filterData: FilterStatsResponse) => {
  const pidsWithIndices = useMemo((): PIDWithIndex[] => {
    if (!filterData?.opids) return [];
    return Object.entries(filterData.opids).map(([_key, pid], index) => ({
      ...pid,
      pidIdx: index,
    }));
  }, [filterData?.opids]);

  const globalStatus = useMemo(
    () => getGlobalStatus(pidsWithIndices, pidsWithIndices.length),
    [pidsWithIndices],
  );

  return { pidsWithIndices, globalStatus };
};
