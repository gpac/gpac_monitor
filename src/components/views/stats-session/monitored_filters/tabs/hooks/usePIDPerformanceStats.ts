import { useMemo } from 'react';
import type { PIDproperties, PIDStats } from '@/types/domain/gpac/filter-stats';

export interface PIDPerformanceStats {
  // From PIDproperties
  bitrate: number | null;
  // From PIDStats — names match source exactly
  disconnected: boolean;
  average_bitrate: number;
  max_bitrate: number;
  average_process_rate: number;
  max_process_rate: number;
  nb_processed: number;
  max_process_time: number;
  total_process_time: number;
  last_ts_sent: PIDStats['last_ts_sent'] | null;
  first_process_time: number | null;
  last_process_time: number | null;
}

export const usePIDPerformanceStats = (
  pid: PIDproperties,
): PIDPerformanceStats => {
  return useMemo(() => {
    const stats = pid.stats;

    return {
      bitrate: pid.bitrate,
      disconnected: stats.disconnected,
      average_bitrate: stats.average_bitrate,
      max_bitrate: stats.max_bitrate,
      average_process_rate: stats.average_process_rate,
      max_process_rate: stats.max_process_rate,
      nb_processed: stats.nb_processed,
      max_process_time: stats.max_process_time,
      total_process_time: stats.total_process_time,
      last_ts_sent: stats.last_ts_sent ?? null,
      first_process_time: stats.first_process_time ?? null,
      last_process_time: stats.last_process_time ?? null,
    };
  }, [pid.bitrate, pid.stats]);
};
