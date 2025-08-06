import { TimeFraction } from './model';

// =======================================
// SERVER RESPONSE TYPES
// =======================================

/**
 * Session stats response from server (send_session_stats)
 */
export interface SessionStatsResponse {
  message: 'session_stats';
  stats: SessionFilterStats[];
}

/**
 * Individual filter stats sent periodically by session
 */
export interface SessionFilterStats {
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
 * Filter-specific stats response from server (initializeFilterStatsLoop)
 */
export interface FilterStatsResponse {
  message: 'filter_stats';
  idx: number;
  status: string;
  bytes_done: number;
  bytes_sent: number;
  pck_done: number;
  pck_sent: number;
  time: number;
  nb_ipid: number;
  nb_opid: number;
}

// =======================================
// PID DATA TYPES
// =======================================

/**
 * Structured PID property with type information
 */
export interface PIDProperty<T = unknown> {
  type: string;
  val: T;
}

/**
 * Raw PID data from server with structured properties
 */
export interface RawPIDData {
  // Direct buffer properties
  buffer: number;
  buffer_total: number;
  source_idx?: number;

  // Structured properties (most properties come this way)
  [key: string]: PIDProperty | number | string | undefined;
}

/**
 * Enhanced PID data with decoded common properties
 */
export interface EnhancedPIDData {
  // Direct buffer properties
  buffer: number;
  buffer_total: number;
  source_idx?: number;

  // Commonly decoded properties for convenience
  codec?: string;
  width?: number;
  height?: number;
  fps?: TimeFraction;
  samplerate?: number;
  channels?: number;
  format?: string;
  bitrate?: number;
  duration?: number;
  
  // Structured properties (most properties come this way)
  [key: string]: PIDProperty | number | string | TimeFraction | undefined;
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
 * Enhanced PID data for Input/Output tabs
 */
export interface TabPIDData {
  name: string;
  // Direct buffer properties
  buffer: number;
  buffer_total: number;
  source_idx?: number;

  // Commonly decoded properties for convenience
  codec?: string;
  width?: number;
  height?: number;
  fps?: TimeFraction;
  samplerate?: number;
  channels?: number;
  format?: string;
  bitrate?: number;
  duration?: number;
  
  parentFilter: {
    name: string;
    codec?: string;
    status: string;
    pck_done: number;
    bytes_done: number;
    pck_sent: number;
    time: number;
  };
  
  // Structured properties (most properties come this way)
  [key: string]: PIDProperty | number | string | TimeFraction | object | undefined;
}

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

// =======================================
// UNIFIED FILTER DATA FOR TABS
// =======================================

/**
 * Complete filter data optimized for tab components
 * Replaces the generic GpacNodeData for monitoring contexts
 */
export interface FilterTabData {
  // Base filter information
  idx: number;
  name: string;
  type: string;
  status: string;
  ID: string | null;
  itag: string | null;

  // Real-time statistics
  bytes_done: number;
  bytes_sent: number;
  pck_sent: number;
  pck_done: number;
  time: number;
  tasks?: number;
  errors?: number;

  // PID data
  nb_ipid: number;
  nb_opid: number;
  ipid: Record<string, EnhancedPIDData>;
  opid: Record<string, EnhancedPIDData>;

  // Optional extended properties
  codec?: string;
  streamtype?: string;
  class?: string;
  last_ts_sent?: TimeFraction;

  // Additional runtime fields that may be sent by server
  pck_ifce_sent?: number;
}

// =======================================
// TYPE GUARDS & UTILITIES
// =======================================

/**
 * Type guard to check if PID property is structured
 */
export function isPIDProperty(value: unknown): value is PIDProperty {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'val' in value
  );
}

/**
 * Extract typed value from PID property
 */
export function extractPIDValue<T>(property: PIDProperty<T> | T): T {
  return isPIDProperty(property) ? property.val : property;
}

/**
 * Convert raw PID data to enhanced format
 */
export function enhancePIDData(rawData: RawPIDData): EnhancedPIDData {
  const enhanced: EnhancedPIDData = { ...rawData };

  // Extract common properties from structured format
  Object.entries(rawData).forEach(([key, value]) => {
    if (isPIDProperty(value)) {
      switch (key) {
        case 'Codec':
        case 'CodecID':
          enhanced.codec = extractPIDValue(value) as string;
          break;
        case 'Width':
          enhanced.width = extractPIDValue(value) as number;
          break;
        case 'Height':
          enhanced.height = extractPIDValue(value) as number;
          break;
        case 'FPS':
          enhanced.fps = extractPIDValue(value) as TimeFraction;
          break;
        case 'SampleRate':
          enhanced.samplerate = extractPIDValue(value) as number;
          break;
        case 'Channels':
          enhanced.channels = extractPIDValue(value) as number;
          break;
        case 'StreamFormat':
          enhanced.format = extractPIDValue(value) as string;
          break;
        case 'Bitrate':
          enhanced.bitrate = extractPIDValue(value) as number;
          break;
        case 'Duration':
          enhanced.duration = extractPIDValue(value) as number;
          break;
      }
    }
  });

  return enhanced;
}