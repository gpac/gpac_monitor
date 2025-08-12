import { SessionFilterStatistics } from './model';

// =======================================
// SERVER RESPONSE TYPES
// =======================================

/**
 * Session stats response from server (send_session_stats)
 */
export interface SessionStatsResponse {
  message: 'session_stats';
  stats: SessionFilterStatistics[];
}

/**
 * Performance stats nested within PID data
 */
export interface PIDStats {
  disconnected: boolean;
  average_process_rate: number;
  max_process_rate: number;
  average_bitrate: number;
  max_bitrate: number;
  nb_processed: number;
  max_process_time: number;
  total_process_time: number;
}

/**
 * Filter-specific stats response from server (initializeFilterStatsLoop)
 */
export interface FilterStatsResponse {
  message?: 'filter_stats';
  idx: number;
  status: string;
  bytes_done: number;
  bytes_sent: number;
  pck_done: number;
  pck_sent: number;
  time: number;
  nb_ipid: number;
  nb_opid: number;
  stats?: PIDStats;
  ipids?: Record<string, PIDproperties>;
  opids?: Record<string, PIDproperties>;
}

/**
 * PID data with embedded stats
 */
export interface PIDproperties {
  name: string;
  buffer: number;
  max_buffer?: number;
  buffer_total?: number;
  nb_pck_queued: number | null;
  would_block: boolean | null;
  eos: boolean;
  playing: boolean | null;
  timescale: number;
  codec: string;
  type: string;
  width: number | null;
  height: number | null;
  pixelformat: string | null;
  samplerate: number | null;
  channels: number | null;
  source_idx: number;
  stats: PIDStats;
}

// =======================================
// TAB-SPECIFIC DATA TYPES
// =======================================

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
