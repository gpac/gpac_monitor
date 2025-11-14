import { memo, useMemo, useRef, useLayoutEffect, useState } from 'react';
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
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 400, height: 230 });

    const { dataPoints: uploadPoints } = useBandwidthChart({
      currentBytes: bytesSent,
      refreshInterval,
    });

    const { dataPoints: downloadPoints } = useBandwidthChart({
      currentBytes: bytesReceived,
      refreshInterval,
    });

    useLayoutEffect(() => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: width || 400, height: 230 });
      }
    }, []);

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
        width: dimensions.width,
        height: dimensions.height,
      });

      return { data: alignedData, options: opts };
    }, [uploadPoints, downloadPoints, dimensions]);

    return (
      <Card className="bg-stat border-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex justify-center items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <LuArrowUpDown className="h-4 w-4 opacity-60" />
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded-full bg-emerald-500" />
              Upload
            </span>
            /
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded-full bg-blue-500" />
              Download
            </span>
            <span className="opacity-60">(Mb/s)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div
            ref={containerRef}
            style={{ width: '100%', height: 230, minHeight: 230 }}
          >
            <UplotChart
              data={data}
              options={options}
              className="w-full h-full"
            />
          </div>
        </CardContent>
      </Card>
    );
  },
);

BandwidthCombinedChart.displayName = 'BandwidthCombinedChart';
