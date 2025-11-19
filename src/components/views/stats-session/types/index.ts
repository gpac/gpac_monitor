import { FilterStatsResponse, TabPIDData } from "@/types";

export interface BufferMetrics {
  current: number;
  total: number;
  isDynamic: boolean;
  usagePercentage: number;
  status: 'normal' | 'warning' | 'critical';
}

export interface FilterBufferStats {
  input: Record<string, BufferMetrics>;
  output: Record<string, BufferMetrics>;
  fpsStats: {
    current: number | null;
    trend: 'stable' | 'increasing' | 'decreasing';
  };
  latencyStats: {
    value: number | null;
    unit: 'ms' | 's';
  };
}

export type TrendDirection = 'stable' | 'increasing' | 'decreasing';

export interface FilterMetric {
  timestamp: number;
  bytes_done: number;
  packets_sent: number;
  packets_done: number;
}

export interface RealTimeMetrics {
  previousBytes: number;
  currentBytes: number;
  previousUpdateTime: number;
  lastUpdate: number;
  bufferStatus: {
    current: number;
    total: number;
  };
}

export interface FilterStatus {
  name: string;
  type: string;
  status: string;
  bytes_done: number;
  nb_packets_sent: number;
  nb_packets_done: number;
}

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

export interface GPACFilterStats {
  idx: number;
  status: string;
  bytes_done: number;
  bytes_sent: number;
  pck_sent: number;
  pck_done: number;
  time: number;
  nb_ipid: number;
  nb_opid: number;
}

/**
 * PID data with position index for edge mapping
 * ipidIdx is the position index (0, 1, 2...), NOT the key name
 */
export interface PIDWithIndex extends TabPIDData {
  ipidIdx: number;
}

/**
 * Props for InputsTab component
 */
export interface InputsTabProps {
  filterData: FilterStatsResponse;
  filterName: string;
}

/**
 * Props for InputCard component
 */
export interface InputCardProps {
  inputName: string;
  pidsByType: Record<string, PIDWithIndex[]>;
  filterIdx: number;
}
