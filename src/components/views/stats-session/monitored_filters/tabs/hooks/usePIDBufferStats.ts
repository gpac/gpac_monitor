import { useMemo } from 'react';
import type { PIDproperties } from '@/types/domain/gpac/filter-stats';

export interface PIDBufferStats {
  displayBuffer: number;
  buffer: number;
  max_buffer: number | null;
  buffer_time: number | null;
  max_buffer_time: number | null;
  nb_buffer_units: number | null;
  min_playout_time: number | null;
  max_playout_time: number | null;
  hasData: boolean;
}

export const usePIDBufferStats = (pid: PIDproperties): PIDBufferStats => {
  return useMemo(() => {
    const stats = pid.stats;
    const buffer_time = stats?.buffer_time ?? null;
    const max_buffer_time = stats?.max_buffer_time ?? null;
    const nb_buffer_units = stats?.nb_buffer_units ?? null;
    const min_playout_time = stats?.min_playout_time ?? null;
    const max_playout_time = stats?.max_playout_time ?? null;

    const hasData =
      pid.buffer > 0 || buffer_time != null || nb_buffer_units != null;

    return {
      displayBuffer: buffer_time ?? pid.buffer,
      buffer: pid.buffer,
      max_buffer: pid.max_buffer ?? null,
      buffer_time,
      max_buffer_time,
      nb_buffer_units,
      min_playout_time,
      max_playout_time,
      hasData,
    };
  }, [pid.buffer, pid.max_buffer, pid.stats]);
};
