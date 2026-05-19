import { memo, useMemo, useRef } from 'react';
import { LuArrowUpDown } from 'react-icons/lu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UplotChart } from '@/components/common/UplotChart';
import uPlot from 'uplot';
import { useBandwidthChart } from './hooks/useBandwidthChart';
import { createBandwidthCombinedConfig } from './config/bandwidthCombinedUplotConfig';
import { DEFAULT_REFRESH_INTERVAL } from './config/bandwidthChartConfig';
import { useContainerSize } from '@/components/common/charts';

interface BandwidthCombinedChartProps {
  filterId: string;
  bytesSent: number;
  bytesReceived: number;
  filterTimeUs?: number;
  refreshInterval?: number;
  windowDurationMs?: number;
}

export const BandwidthCombinedChart = memo(
  ({
    filterId,
    bytesSent,
    bytesReceived,
    filterTimeUs = 0,
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
    windowDurationMs,
  }: BandwidthCombinedChartProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const dimensions = useContainerSize(containerRef);
    const timeLabelsRef = useRef<string[]>([]);

    const { dataPoints: outbandPoints } = useBandwidthChart({
      filterId,
      currentBytes: bytesSent,
      refreshInterval,
      type: 'outband',
      windowDurationMs,
    });

    const { dataPoints: inbandPoints } = useBandwidthChart({
      filterId,
      currentBytes: bytesReceived,
      refreshInterval,
      type: 'inband',
      windowDurationMs,
    });

    const options = useMemo(() => {
      return createBandwidthCombinedConfig({
        timeLabelsRef,
        width: dimensions.width,
        height: dimensions.height,
      });
    }, [dimensions]);

    const data = useMemo(() => {
      const maxLength = Math.max(outbandPoints.length, inbandPoints.length);
      const indices = Array.from(
        { length: maxLength },
        (_unused, index) => index,
      );

      const outbandData = indices.map(
        (index) => outbandPoints[index]?.value || 0,
      );
      const inbandData = indices.map(
        (index) => inbandPoints[index]?.value || 0,
      );
      timeLabelsRef.current = indices.map(
        (index) =>
          outbandPoints[index]?.time || inbandPoints[index]?.time || '',
      );

      const filterTimeData = indices.map(() => filterTimeUs);
      const alignedData: uPlot.AlignedData = [
        indices,
        outbandData,
        inbandData,
        filterTimeData,
      ];

      return alignedData;
    }, [outbandPoints, inbandPoints, filterTimeUs]);

    return (
      <Card className="bg-monitor-panel border-transparent">
        <CardHeader className="pb-1">
          <CardTitle className="flex justify-center items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <LuArrowUpDown className="h-4 w-4 opacity-60" />
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded-full bg-monitor-active-filter" />
              Inband
            </span>
            /
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded-full bg-emerald-500" />
              Outband
            </span>
            <span className="opacity-60 normal-case">Mb/s</span> /{' '}
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded-full bg-[#f59e0b]" />
              Filter Proc. Time
            </span>
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
