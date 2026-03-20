import { useDataSource } from '@/services/dataSource/DataSourceContext';
import { useBandwidthChartLive } from './useBandwidthChartLive';
import { useBandwidthChartHistory } from './useBandwidthChartHistory';
import type { ChartDataPoint } from '@/shared/store/slices/monitoredFilterSlice';

export interface UseBandwidthChartOptions {
  filterId: string;
  currentBytes: number;
  refreshInterval: number;
  type: 'upload' | 'download';
}

export const useBandwidthChart = (options: UseBandwidthChartOptions) => {
  const { mode } = useDataSource();
  const isHistory = mode === 'history';

  const history = useBandwidthChartHistory({
    filterId: options.filterId,
    type: options.type,
  });

  const live = useBandwidthChartLive(options);

  return isHistory ? history : live;
};

export type { ChartDataPoint };
