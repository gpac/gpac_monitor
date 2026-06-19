import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/shared/store';
import {
  selectFilterNetworkChartData,
  selectFilterLastTaskTimeData,
} from '@/shared/store/selectors';

export interface FilterPerformanceChartOptions {
  filterId: string;
}

export const useFilterPerformanceChartData = ({
  filterId,
}: FilterPerformanceChartOptions) => {
  const rawNetwork = useSelector((state: RootState) =>
    selectFilterNetworkChartData(state, filterId),
  );
  const lastTaskTimePoints = useSelector((state: RootState) =>
    selectFilterLastTaskTimeData(state, filterId),
  );

  const outbandPoints = useMemo(
    () => rawNetwork?.outband ?? [],
    [rawNetwork?.outband],
  );
  const inbandPoints = useMemo(
    () => rawNetwork?.inband ?? [],
    [rawNetwork?.inband],
  );

  return { outbandPoints, inbandPoints, lastTaskTimePoints };
};
