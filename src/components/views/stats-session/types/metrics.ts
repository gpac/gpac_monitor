export interface BufferMetrics {
  current: number;
  total: number;
  isDynamic: boolean;
  usagePercentage: number;
  status: 'normal' | 'warning' | 'critical';
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
