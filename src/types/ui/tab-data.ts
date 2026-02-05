import type { PIDproperties } from '../domain/gpac/filter-stats';

/**
 * Data structure specifically for Overview Tab
 */
export interface OverviewTabData {
  // Filter identification
  name: string;
  type: string;
  idx: number;
  status: string;

  // Processing metrics
  tasks?: number;
  time: number;

  // Packet metrics
  pck_done: number;
  pck_sent: number;
  pck_ifce_sent?: number; // Interface-specific packets

  // Data metrics
  bytes_done: number;
  bytes_sent: number;

  // PID counts
  nb_ipid: number;
  nb_opid: number;

  // Error tracking
  errors?: number;
  current_errors?: number;
}

/**
 * Buffer information for a single PID
 */
export interface PIDBufferInfo {
  name: string;
  buffer: number;
  bufferTotal: number;
  usage: number; // percentage
  sourceIdx?: number;
  color: string; // UI helper for progress bar color
}

/**
 * Data structure specifically for Buffers Tab
 */
export interface BuffersTabData {
  name: string;
  inputBuffers: PIDBufferInfo[];
  totalBufferInfo: {
    totalBuffer: number;
    totalCapacity: number;
    averageUsage: number;
  };
}

/**
 * Enhanced PID data for Input/Output tabs (alias to PIDproperties)
 */
export type TabPIDData = PIDproperties;

/**
 * Data structure specifically for Network Tab
 */
export interface NetworkTabData {
  // Current network stats
  bytesSent: number;
  bytesReceived: number;
  packetsSent: number;
  packetsReceived: number;

  // Calculated throughput (for bandwidth charts)
  uploadThroughput?: number; // bytes/sec
  downloadThroughput?: number; // bytes/sec
}
