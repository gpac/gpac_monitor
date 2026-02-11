import type { PidPropsMap } from './pid_props';
import { GpacStreamType } from './stream-types';

// =======================================
// SERVER RESPONSE TYPES
// =======================================

/**
 * Session filter statistics (from GPAC session)
 */
export interface SessionFilterStatistics extends Record<string, unknown> {
  idx: number;
  status: string;
  bytes_done: number;
  bytes_sent: number;
  pck_sent: number;
  pck_done: number;
  time: number;
  nb_ipid: number;
  nb_opid: number;
  is_eos?: boolean;
}

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
  last_ts_sent?: number;
  first_process_time?: number;
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
  eos_received?: boolean;
  bitrate: number | null;
  playing: boolean | null;
  timescale: number;
  codec: string;
  type: GpacStreamType;
  width: number | null;
  height: number | null;
  pixelformat: string | null;
  samplerate: number | null;
  channels: number | null;
  source_idx: number;
  stats: PIDStats;

  // Identification & Metadata (UX: badges + tooltips)
  id?: string;
  trackNumber?: number;
  serviceID?: string;
  language?: string;
  role?: string;
  properties?: PidPropsMap;
}
