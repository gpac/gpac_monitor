import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UplotChart } from '@/components/common/UplotChart';
import { useChartData } from '../hooks/useChartData';
import { createCpuMemoryUplotConfig } from './uplotConfig';
import {
  prepareCpuMemoryData,
  calculateMemoryYMax,
} from '@/utils/charts/cpuMemory';

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
    const currentMemoryMB = useMemo(
      () => currentMemoryBytes / (1024 * 1024),
      [currentMemoryBytes],
    );

    const memoryYAxisMax = useMemo(
      () => calculateMemoryYMax(currentMemoryMB),
      [currentMemoryMB],
    );

    const { dataPoints } = useChartData(
      currentCPUPercent,
      currentMemoryMB,
      isLive,
      maxPoints,
      windowDuration,
      150,
    );

    const { data, options } = useMemo(() => {
      const { alignedData, relativeSeconds, memoryData, cpuData } =
        prepareCpuMemoryData(dataPoints);

      const opts = createCpuMemoryUplotConfig({
        memoryYAxisMax,
        relativeSeconds,
        memoryData,
        cpuData,
      });

      return { data: alignedData, options: opts };
    }, [dataPoints, memoryYAxisMax]);

    return (
      <Card className="bg-stat border-transparent">
        <CardHeader className="pb-2">
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
        <CardContent className="p-2">
          <div
            style={{
              width: '100%',
              height: '200px',
            }}
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

CpuMemoryChartUplot.displayName = 'CpuMemoryChartUplot';
