import { useDataMode } from '@/shared/hooks/data/useDataMode';
import { useBandwidthChartLive } from './useBandwidthChartLive';
import { useBandwidthChartHistory } from './useBandwidthChartHistory';
import type { ChartDataPoint } from '@/shared/store/slices/monitoredFilterSlice';

export interface UseBandwidthChartOptions {
  filterId: string;
  currentBytes: number;
  refreshInterval: number;
  type: 'upload' | 'download';
  windowDurationMs?: number;
}

export const useBandwidthChart = (options: UseBandwidthChartOptions) => {
  const { isHistory } = useDataMode();

  const history = useBandwidthChartHistory({
    filterId: options.filterId,
    type: options.type,
  });

  const live = useBandwidthChartLive(options);

  return isHistory ? history : live;
};

export type { ChartDataPoint };
