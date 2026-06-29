import type { PIDproperties } from '@/types/domain/gpac/filter-stats';
import type { PIDMetricSample } from '@/components/views/stats-session/types/pid';
import { buildPIDKey } from '@/components/views/stats-session/types/pid';

type FilterStatsPIDData = {
  idx: number;
  ipids?: Record<string, PIDproperties>;
  opids?: Record<string, PIDproperties>;
};

function pidSampleFrom(
  pid: PIDproperties,
  sessionTimeUs: number,
): PIDMetricSample {
  const stats = pid.stats;
  return {
    sessionTimeUs,
    averageBitrate: stats.average_bitrate >= 0 ? stats.average_bitrate : null,
    bitrate: pid.bitrate,
    maxBitrate: stats.max_bitrate >= 0 ? stats.max_bitrate : null,
    bufferTime: stats.buffer_time ?? pid.buffer,
    buffer: pid.buffer,
    maxBuffer: pid.max_buffer ?? null,
    maxBufferTime: stats.max_buffer_time ?? null,
    nbBufferUnits: stats.nb_buffer_units ?? null,
    minPlayoutTime: stats.min_playout_time ?? null,
    maxPlayoutTime: stats.max_playout_time ?? null,
    processTime:
      stats.average_process_time != null
        ? Math.round(stats.average_process_time * 10) / 10
        : null,
    maxProcessTime: stats.max_process_time,
    totalProcessTime: stats.total_process_time,
    nbProcessed: stats.nb_processed,
    processRate:
      stats.average_process_rate >= 0 ? stats.average_process_rate : null,
    maxProcessRate: stats.max_process_rate >= 0 ? stats.max_process_rate : null,
    ts: stats.last_process_time ?? null,
    firstProcessTime: stats.first_process_time ?? null,
  };
}

export function buildPIDSamplesFromFilterStats(
  filterStats: FilterStatsPIDData,
  tsUs: number | null | undefined,
  sessionStartUs: number | null,
): Array<{ key: string; sample: PIDMetricSample }> {
  if (tsUs == null || sessionStartUs == null) return [];
  const sessionTimeUs = tsUs - sessionStartUs;
  const samples: Array<{ key: string; sample: PIDMetricSample }> = [];

  if (filterStats.ipids) {
    Object.entries(filterStats.ipids).forEach(([, pid], pidIdx) => {
      samples.push({
        key: buildPIDKey(filterStats.idx, 'input', pidIdx),
        sample: pidSampleFrom(pid, sessionTimeUs),
      });
    });
  }
  if (filterStats.opids) {
    Object.entries(filterStats.opids).forEach(([, pid], pidIdx) => {
      samples.push({
        key: buildPIDKey(filterStats.idx, 'output', pidIdx),
        sample: pidSampleFrom(pid, sessionTimeUs),
      });
    });
  }

  return samples;
}
