import type { FilterMetric } from './metrics';

export interface MetricCardProps {
  title: string;
  value: number;
  total?: number;
  unit?: string;
  className?: string;
}

export interface ProcessingChartProps {
  history: FilterMetric[];
  className?: string;
}

export interface PIDMetricsCardProps {
  inputCount: number;
  outputCount: number;
  name: string;
}
