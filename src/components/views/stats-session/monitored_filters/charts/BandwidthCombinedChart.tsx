import { memo, useMemo } from 'react';
import { LuArrowUpDown } from 'react-icons/lu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UplotChart } from '@/components/common/UplotChart';
import uPlot from 'uplot';
import { useBandwidthChart } from './hooks/useBandwidthChart';
import { createBandwidthCombinedConfig } from './config/bandwidthCombinedUplotConfig';
import { DEFAULT_REFRESH_INTERVAL } from './config/bandwidthChartConfig';

interface BandwidthCombinedChartProps {
  bytesSent: number;
  bytesReceived: number;
  refreshInterval?: number;
}

export const BandwidthCombinedChart = memo(
  ({
    bytesSent,
    bytesReceived,
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
  }: BandwidthCombinedChartProps) => {
    const { dataPoints: uploadPoints } = useBandwidthChart({
      currentBytes: bytesSent,
      refreshInterval,
    });

    const { dataPoints: downloadPoints } = useBandwidthChart({
      currentBytes: bytesReceived,
      refreshInterval,
    });

    const { data, options } = useMemo(() => {
      const maxLength = Math.max(uploadPoints.length, downloadPoints.length);
      const indices = Array.from({ length: maxLength }, (_, i) => i);

      const uploadData = indices.map(
        (i) => uploadPoints[i]?.bytesPerSecond || 0,
      );
      const downloadData = indices.map(
        (i) => downloadPoints[i]?.bytesPerSecond || 0,
      );
      const timeLabels = indices.map(
        (i) => uploadPoints[i]?.time || downloadPoints[i]?.time || '',
      );

      const alignedData: uPlot.AlignedData = [
        indices,
        uploadData,
        downloadData,
      ];

      const opts = createBandwidthCombinedConfig({
        uploadData,
        downloadData,
        timeLabels,
      });

      return { data: alignedData, options: opts };
    }, [uploadPoints, downloadPoints]);

    return (
      <Card className="bg-stat border-transparent w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-center items-center gap-2 text-sm stat stat-label">
            <LuArrowUpDown className="h-4 w-4" />
            Upload / Download Bandwidth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UplotChart data={data} options={options} className="w-auto" />
        </CardContent>
      </Card>
    );
  },
);

BandwidthCombinedChart.displayName = 'BandwidthCombinedChart';
