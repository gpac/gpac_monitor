import { memo, useMemo } from 'react';
import { Chart, ChartDataPoint, ChartConfig } from '@/components/common/Chart';

export interface CPUDataPoint extends ChartDataPoint {
  cpu_percent: number;
}

interface CPUChartProps {
  currentCPUPercent: number;
  isLive: boolean;
  maxPoints?: number;
  windowDuration?: number;
}

export const CPUChart = memo(
  ({
    currentCPUPercent,
    isLive,
    maxPoints = 400,
    windowDuration,
  }: CPUChartProps) => {
    const cpuChartConfig: ChartConfig = useMemo(
      () => ({
        title: 'CPU Usage',
        icon: '',
        height: 200,
        maxPoints,
        windowDuration,
        throttleInterval: 150,
        yAxisDomain: [0, 100],
        yAxisTicks: [0, 25, 50, 75, 100],
        yAxisFormatter: (value: number) => `${value}%`,
        areas: [
          {
            dataKey: 'cpu_percent',
            name: 'CPU',
            stroke: '#ef4444',
            fill: 'url(#cpuGradient)',
            strokeWidth: 2,
          },
        ],
        tooltip: {
          formatter: (value: number) => [`${value.toFixed(2)}%`, 'CPU'],
          labelFormatter: (label: string) => `Time: ${label}`,
        },
        gradients: [
          {
            id: 'cpuGradient',
            color: '#ef4444',
            opacity: { start: 0.6, end: 0.1 },
          },
        ],
      }),
      [maxPoints, windowDuration],
    );

    const createDataPoint = useMemo(
      () =>
        (
          timestamp: number,
          time: string,
          _currentValue: number,
        ): CPUDataPoint => ({
          timestamp,
          time,
          cpu_percent: currentCPUPercent,
        }),
      [currentCPUPercent],
    );

    return (
      <Chart
        config={cpuChartConfig}
        currentValue={currentCPUPercent}
        isLive={isLive}
        createDataPoint={createDataPoint}
      />
    );
  },
);

CPUChart.displayName = 'CPUChart';
