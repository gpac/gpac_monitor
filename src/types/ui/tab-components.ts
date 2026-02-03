import type { FilterStatsResponse } from '../domain/gpac/filter-stats';

/**
 * Props for Tab Components
 */
export interface OverviewTabProps {
  filter: FilterStatsResponse;
}

export interface BuffersTabProps {
  filter: FilterStatsResponse;
}

export interface InputsTabProps {
  filter: FilterStatsResponse;
}

export interface OutputsTabProps {
  filter: FilterStatsResponse;
}

export interface NetworkTabProps {
  filter: FilterStatsResponse;
  refreshInterval?: number;
}

/**
 * Props for Card Components
 */
export interface PIDMetricsCardProps {
  data: {
    nb_ipid: number;
    nb_opid: number;
  };
}

export interface ProcessingCardProps {
  tasks?: number;
  time?: number;
}

export interface PacketsCardProps {
  pck_done?: number;
  pck_sent?: number;
  pck_ifce_sent?: number;
}

export interface DataCardProps {
  bytes_done?: number;
  bytes_sent?: number;
}

export interface PIDDetailsProps {
  name: string;
  buffer: number;
  buffer_total: number;
  source_idx?: number;
  codec?: string;
  [key: string]: unknown;
}

/**
 * Props for Chart Components
 */
export interface BandwidthChartProps {
  currentBytes: number;
  type: 'sent' | 'received';
  refreshInterval: number;
}

export interface BandwidthDataPoint {
  timestamp: number;
  value: number; // bytes per second
  label: string; // formatted value
}

/**
 * Utility Types for UI
 */
export type BufferStatus = 'normal' | 'warning' | 'critical';

export type BufferProgressColor = 'green' | 'yellow' | 'red';

export type FilterProcessingStatus =
  | 'play'
  | 'stop'
  | 'flush'
  | 'error'
  | 'init'
  | string;

export type PIDDirection = 'input' | 'output';

export type NetworkMetricType = 'upload' | 'download' | 'total';
