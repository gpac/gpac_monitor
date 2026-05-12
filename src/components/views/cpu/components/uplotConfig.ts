import { formatChartSeconds } from '@/utils/formatting/time';
import {
  createLineChartConfig,
  type SeriesDef,
} from '@/components/common/charts';

export interface UplotConfigParams {
  memoryYAxisMax: number;
  width: number;
  height: number;
}

const CPU_SERIES: SeriesDef[] = [
  {
    label: 'Memory (MB)',
    color: '#38bdf8',
    formatValue: (v) => `${v.toFixed(2)} MB`,
    strokeWidth: 2,
    fill: 'rgba(56, 189, 248, 0.15)',
  },
  {
    label: 'CPU (%)',
    color: '#ef4444',
    formatValue: (v) => `${v.toFixed(2)}%`,
    strokeWidth: 2,
    fill: 'rgba(239, 68, 68, 0.15)',
    yAxis: 'right',
  },
];

export const createCpuMemoryUplotConfig = ({
  memoryYAxisMax,
  width,
  height,
}: UplotConfigParams) =>
  createLineChartConfig({
    series: CPU_SERIES,
    leftAxis: {
      formatY: (v) => `${v.toFixed(0)}`,
      color: '#38bdf8',
      gridStroke: 'rgba(56, 189, 248, 0.1)',
      range: [0, memoryYAxisMax],
      size: 60,
    },
    rightAxis: {
      formatY: (v) => `${v}%`,
      color: '#ef4444',
      range: [0, 100],
      size: 55,
    },
    formatX: formatChartSeconds,
    width,
    height,
  });
