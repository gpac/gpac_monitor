import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UplotChart } from '@/components/common/UplotChart';
import { useChartData } from '../hooks/useChartData';
import { createCpuMemoryUplotConfig } from './uplotConfig';
import {
  prepareCpuMemoryData,
  calculateMemoryYMax,
  type CpuMemoryDataPoint,
} from '@/utils/charts/cpuMemory';
import type { CPUStats } from '@/types/domain/system';

interface CpuMemoryChartUplotProps {
  currentCPUPercent: number;
  currentMemoryBytes: number;
  isLive: boolean;
  maxPoints?: number;
  windowDuration?: number;
  historyStats?: CPUStats[];
}

export const CpuMemoryChartUplot = memo(
  ({
    currentCPUPercent,
    currentMemoryBytes,
    isLive,
    maxPoints = 400,
    windowDuration,
    historyStats,
  }: CpuMemoryChartUplotProps) => {
    const currentMemoryMB = useMemo(
      () => currentMemoryBytes / (1024 * 1024),
      [currentMemoryBytes],
    );

    const memoryYAxisMax = useMemo(
      () => calculateMemoryYMax(currentMemoryMB),
      [currentMemoryMB],
    );

    // In history mode, bypass live accumulation and use GPAC timestamps directly
    const { dataPoints: liveDataPoints } = useChartData(
      currentCPUPercent,
      currentMemoryMB,
      historyStats ? false : isLive,
      maxPoints,
      windowDuration,
      150,
    );

    const historyDataPoints = useMemo((): CpuMemoryDataPoint[] => {
      if (!historyStats) return [];
      return historyStats.map((s) => ({
        timestamp: s.timestamp / 1000, // µs → ms
        cpu_percent: s.process_cpu_usage,
        memory_mb: s.process_memory / (1024 * 1024),
      }));
    }, [historyStats]);

    const dataPoints = historyStats ? historyDataPoints : liveDataPoints;

    const options = useMemo(() => {
      return createCpuMemoryUplotConfig({ memoryYAxisMax });
    }, [memoryYAxisMax]);

    const data = useMemo(() => {
      const { alignedData } = prepareCpuMemoryData(dataPoints);
      return alignedData;
    }, [dataPoints]);

    return (
      <Card className="bg-stat border-transparent h-full flex flex-col">
        <CardHeader className="pb-2 flex-shrink-0">
          <CardTitle className="flex justify-center items-center gap-2 text-sm stat stat-label">
            <span className="flex items-center gap-1.5">
              <span
                className="w-3 h-0.5"
                style={{ backgroundColor: '#38bdf8' }}
              />
              Memory
            </span>
            /
            <span className="flex items-center gap-1.5">
              <span
                className="w-3 h-0.5"
                style={{ backgroundColor: '#ef4444' }}
              />
              CPU
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 flex-1 min-h-0">
          <div className="w-full h-full">
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

CpuMemoryChartUplot.displayName = 'CpuMemoryChartUplot';
