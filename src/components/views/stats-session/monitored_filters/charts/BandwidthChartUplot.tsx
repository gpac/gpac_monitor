import { memo, useMemo } from 'react';
import { LuUpload, LuDownload } from 'react-icons/lu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UplotChart } from '@/components/common/UplotChart';
import uPlot from 'uplot';
import { useBandwidthChart } from './hooks/useBandwidthChart';
import { createBandwidthUplotConfig } from './config/bandwidthUplotConfig';
import {
  CHART_TITLES,
  DEFAULT_REFRESH_INTERVAL,
} from './config/bandwidthChartConfig';

interface BandwidthChartUplotProps {
  currentBytes: number;
  type: 'sent' | 'received';
  refreshInterval?: number;
}

export const BandwidthChartUplot = memo(
  ({
    currentBytes,
    type,
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
  }: BandwidthChartUplotProps) => {
    const { dataPoints } = useBandwidthChart({
      currentBytes,
      refreshInterval,
    });

    const chartTitle = useMemo(() => CHART_TITLES[type], [type]);

    const { data, options } = useMemo(() => {
      // Use simple index-based X-axis for consistency
      const indices = dataPoints.map((_, i) => i);
      const bandwidthData = dataPoints.map((p) => p.bytesPerSecond);
      const timeLabels = dataPoints.map((p) => p.time);

      const alignedData: uPlot.AlignedData = [indices, bandwidthData];

      const opts = createBandwidthUplotConfig({
        type,
        bandwidthData,
        timeLabels,
      });

      return { data: alignedData, options: opts };
    }, [dataPoints, type]);

    return (
      <Card className="bg-stat border-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm stat stat-label">
            {type === 'sent' ? (
              <LuUpload className="h-4 w-4" />
            ) : (
              <LuDownload className="h-4 w-4" />
            )}
            {chartTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UplotChart data={data} options={options} className="" />
        </CardContent>
      </Card>
    );
  },
);

BandwidthChartUplot.displayName = 'BandwidthChartUplot';
