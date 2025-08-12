import {
  FilterStatsResponse,
  TabPIDData,
  PIDBufferInfo,
  NetworkTabData,
  OverviewTabData,
} from './filter-stats';

// =======================================
// TAB COMPONENT PROP INTERFACES
// =======================================

/**
 * Props for Overview Tab Component
 */
export interface OverviewTabProps {
  filter: FilterStatsResponse;
}

/**
 * Props for Buffers Tab Component
 */
export interface BuffersTabProps {
  filter: FilterStatsResponse;
}

/**
 * Props for Inputs Tab Component
 */
export interface InputsTabProps {
  filter: FilterStatsResponse;
}

/**
 * Props for Outputs Tab Component
 */
export interface OutputsTabProps {
  filter: FilterStatsResponse;
}

/**
 * Props for Network Tab Component
 */
export interface NetworkTabProps {
  filter: FilterStatsResponse;
  refreshInterval?: number;
}

// =======================================
// DATA TRANSFORMATION INTERFACES
// =======================================

/**
 * Service interface for transforming raw filter data for tabs
 */
export interface FilterTabDataTransformer {
  /**
   * Transform filter data for Overview Tab
   */
  toOverviewData(filter: FilterStatsResponse): OverviewTabData;

  /**
   * Transform filter data for Buffers Tab
   */
  toBuffersData(filter: FilterStatsResponse): {
    inputBuffers: PIDBufferInfo[];
    totalBufferInfo: {
      totalBuffer: number;
      totalCapacity: number;
      averageUsage: number;
    };
  };

  /**
   * Transform filter data for Input PIDs
   */
  toInputPIDsData(filter: FilterStatsResponse): TabPIDData[];

  /**
   * Transform filter data for Output PIDs
   */
  toOutputPIDsData(filter: FilterStatsResponse): TabPIDData[];

  /**
   * Transform filter data for Network Tab
   */
  toNetworkData(filter: FilterStatsResponse): NetworkTabData;
}

// =======================================
// CARD COMPONENT INTERFACES
// =======================================

/**
 * Props for PID Metrics Card
 */
export interface PIDMetricsCardProps {
  data: {
    nb_ipid: number;
    nb_opid: number;
  };
}

/**
 * Props for Processing Card
 */
export interface ProcessingCardProps {
  tasks?: number;
  time?: number;
}

/**
 * Props for Packets Card
 */
export interface PacketsCardProps {
  pck_done?: number;
  pck_sent?: number;
  pck_ifce_sent?: number;
}

/**
 * Props for Data Card
 */
export interface DataCardProps {
  bytes_done?: number;
  bytes_sent?: number;
}

/**
 * Props for PID Details Card
 */
export interface PIDDetailsProps {
  name: string;
  buffer: number;
  buffer_total: number;
  source_idx?: number;
  codec?: string;
  // Additional PID properties
  [key: string]: unknown;
}

// =======================================
// CHART COMPONENT INTERFACES
// =======================================

/**
 * Props for Bandwidth Chart Component
 */
export interface BandwidthChartProps {
  currentBytes: number;
  type: 'sent' | 'received';
  refreshInterval: number;
}

/**
 * Data point for bandwidth chart
 */
export interface BandwidthDataPoint {
  timestamp: number;
  value: number; // bytes per second
  label: string; // formatted value
}

// =======================================
// UTILITY TYPES
// =======================================

/**
 * Buffer status levels for UI indication
 */
export type BufferStatus = 'normal' | 'warning' | 'critical';

/**
 * Buffer color mapping for progress indicators
 */
export type BufferProgressColor = 'green' | 'yellow' | 'red';

/**
 * Filter processing status
 */
export type FilterProcessingStatus =
  | 'play'
  | 'stop'
  | 'flush'
  | 'error'
  | 'init'
  | string; // Allow other custom statuses

/**
 * PID direction for context-aware components
 */
export type PIDDirection = 'input' | 'output';

/**
 * Network metric types for bandwidth monitoring
 */
export type NetworkMetricType = 'upload' | 'download' | 'total';
