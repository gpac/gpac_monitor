import { memo, useMemo } from 'react';
import { Chart, ChartDataPoint, ChartConfig } from '@/components/common/Chart';

export interface MemoryDataPoint extends ChartDataPoint {
  memory_mb: number;
}

interface MemoryUsageChartProps {
  currentMemoryBytes: number;
  isLive: boolean;
  maxPoints?: number;
  windowDuration?: number;
}

export const MemoryUsageChart = memo(
  ({
    currentMemoryBytes,
    isLive,
    maxPoints = 400,
    windowDuration,
  }: MemoryUsageChartProps) => {
    const currentMemoryMB = useMemo(
      () => currentMemoryBytes / (1024 * 1024),
      [currentMemoryBytes],
    );

    // Calculate smart Y-axis max (round up to nearest 50 MB above current value)
    const yAxisMax = useMemo(() => {
      const minScale = 100; // Minimum scale 100 MB
      const roundTo = 50; // Round to 50 MB increments
      const calculated = Math.ceil((currentMemoryMB * 1.5) / roundTo) * roundTo;
      return Math.max(minScale, calculated);
    }, [currentMemoryMB]);

    // Generate Y-axis ticks dynamically (0, 25%, 50%, 75%, 100% of max)
    const yAxisTicks = useMemo(() => {
      return [0, yAxisMax * 0.25, yAxisMax * 0.5, yAxisMax * 0.75, yAxisMax];
    }, [yAxisMax]);

    const memoryChartConfig: ChartConfig = useMemo(
      () => ({
        title: 'Memory Usage',
        icon: (
          <span className="text-info text-base font-semibold tabular-nums">
            {currentMemoryMB.toFixed(2)} MB
          </span>
        ),
        height: 200,
        maxPoints,
        windowDuration,
        throttleInterval: 150,
        yAxisDomain: [0, yAxisMax],
        yAxisTicks,
        yAxisFormatter: (value: number) => `${value.toFixed(0)}`,
        areas: [
          {
            dataKey: 'memory_mb',
            name: 'Memory (MB)',
            stroke: '#38bdf8',
            fill: 'url(#memoryGradient)',
            strokeWidth: 2,
          },
        ],
        tooltip: {
          formatter: (value: number) => [`${value.toFixed(2)} MB`, 'Memory'],
          labelFormatter: (label: string) => `Time: ${label}`,
        },
        gradients: [
          {
            id: 'memoryGradient',
            color: '#38bdf8',
            opacity: { start: 0.16, end: 0.05 },
          },
        ],
      }),
      [maxPoints, windowDuration, yAxisMax, yAxisTicks, currentMemoryMB],
    );

    const createDataPoint = useMemo(
      () =>
        (
          timestamp: number,
          time: string,
          _currentValue: number,
        ): MemoryDataPoint => ({
          timestamp,
          time,
          memory_mb: currentMemoryMB,
        }),
      [currentMemoryMB],
    );

    return (
      <Chart
        config={memoryChartConfig}
        currentValue={currentMemoryMB}
        isLive={isLive}
        createDataPoint={createDataPoint}
      />
    );
  },
);

MemoryUsageChart.displayName = 'MemoryUsageChart';
