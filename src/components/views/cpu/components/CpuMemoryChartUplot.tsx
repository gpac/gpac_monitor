import { memo, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UplotChart } from '@/components/common/UplotChart';
import uPlot from 'uplot';
import { useOptimizedResize } from '@/shared/hooks/useOptimizedResize';
import { useChartData } from '../hooks/useChartData';
import { createCpuMemoryUplotConfig } from './uplotConfig';

export interface CpuMemoryDataPoint {
  timestamp: number;
  time: string;
  cpu_percent: number;
  memory_mb: number;
}

interface CpuMemoryChartUplotProps {
  currentCPUPercent: number;
  currentMemoryBytes: number;
  isLive: boolean;
  maxPoints?: number;
  windowDuration?: number;
}

export const CpuMemoryChartUplot = memo(
  ({
    currentCPUPercent,
    currentMemoryBytes,
    isLive,
    maxPoints = 400,
    windowDuration,
  }: CpuMemoryChartUplotProps) => {
    const [isResizing, setIsResizing] = useState(false);

    const currentMemoryMB = useMemo(
      () => currentMemoryBytes / (1024 * 1024),
      [currentMemoryBytes],
    );

    const memoryYAxisMax = useMemo(() => {
      const minScale = 100;
      const roundTo = 50;
      const calculated = Math.ceil((currentMemoryMB * 1.5) / roundTo) * roundTo;
      return Math.max(minScale, calculated);
    }, [currentMemoryMB]);

    const { ref } = useOptimizedResize({
      onResizeStart: () => setIsResizing(true),
      onResizeEnd: () => setIsResizing(false),
      debounce: 32,
      throttle: true,
      useTransform: true,
    }) as { ref: React.RefObject<HTMLElement> };

    const chartRef = ref as React.RefObject<HTMLDivElement>;

    const { dataPoints } = useChartData(
      currentCPUPercent,
      currentMemoryMB,
      isLive,
      maxPoints,
      windowDuration,
      150,
    );

    const { data, options } = useMemo(() => {
      const firstTimestamp =
        dataPoints.length > 0 ? dataPoints[0].timestamp : 0;
      const relativeSeconds = dataPoints.map(
        (p) => (p.timestamp - firstTimestamp) / 1000,
      );
      const memoryData = dataPoints.map((p) => p.memory_mb);
      const cpuData = dataPoints.map((p) => p.cpu_percent);

      const alignedData: uPlot.AlignedData = [
        relativeSeconds,
        memoryData,
        cpuData,
      ];

      const opts = createCpuMemoryUplotConfig({
        memoryYAxisMax,
        relativeSeconds,
        memoryData,
        cpuData,
      });

      return { data: alignedData, options: opts };
    }, [dataPoints, memoryYAxisMax]);

    return (
      <Card ref={chartRef} className="bg-stat border-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-center items-center gap-2 text-sm stat stat-label">
            Memory / CPU
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`gpu-optimized ${isResizing ? 'contain-layout contain-style is-interacting' : ''}`}
          >
            <UplotChart data={data} options={options} className="w-full" />
          </div>
        </CardContent>
      </Card>
    );
  },
);

CpuMemoryChartUplot.displayName = 'CpuMemoryChartUplot';
