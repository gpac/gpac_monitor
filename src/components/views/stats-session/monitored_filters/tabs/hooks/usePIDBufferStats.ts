import { useMemo } from 'react';
import type { PIDproperties } from '@/types/domain/gpac/filter-stats';

export interface PIDBufferStats {
  // Direct PIDproperties fields
  buffer: number;
  max_buffer: number | null;
  // From pid.stats — optional, sent only when non-zero
  buffer_time: number | null;
  max_buffer_time: number | null;
  nb_buffer_units: number | null;
  min_playout_time: number | null;
  max_playout_time: number | null;
  // True when at least one meaningful value is present
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
