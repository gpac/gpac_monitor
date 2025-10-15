import { memo, useMemo } from 'react';
import { Chart, ChartDataPoint, ChartConfig } from '@/components/common/Chart';

export interface CPUDataPoint extends ChartDataPoint {
  cpu_percent: number;
  memory_percent: number;
}

interface CPUChartProps {
  currentCPUPercent: number;
  isLive: boolean;
  maxPoints?: number;
}

export const CPUChart = memo(
  ({ currentCPUPercent, isLive, maxPoints = 400 }: CPUChartProps) => {
    const cpuChartConfig: ChartConfig = useMemo(
      () => ({
        title: 'CPU Usage over time',
        icon: '',
        height: 200,
        maxPoints,
        throttleInterval: 50,
        yAxisDomain: [0, 100],
        yAxisTicks: [0, 50, 100],
        yAxisFormatter: (value: number) => `${value}%`,
        areas: [
          {
            dataKey: 'cpu_percent',
            name: 'GPAC Process',
            stroke: '#ef4444',
            fill: 'url(#processGradient)',
            strokeWidth: 2,
          },
        ],
        tooltip: {
          formatter: (value: number) => [`${value.toFixed(2)}%`, 'CPU'],
          labelFormatter: (label: string) => `Time: ${label}`,
        },
        gradients: [
          {
            id: 'processGradient',
            color: '#ef4444',
            opacity: { start: 0.6, end: 0.1 },
          },
        ],
      }),
      [maxPoints],
    );

    const createDataPoint = (
      timestamp: number,
      time: string,
      currentValue: number,
    ): CPUDataPoint => ({
      timestamp,
      time,
      cpu_percent: currentValue,
      memory_percent: 0,
    });

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
