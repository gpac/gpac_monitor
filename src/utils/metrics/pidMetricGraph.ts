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
    bufferTime: stats.buffer_time ?? pid.buffer,
    processTime:
      stats.average_process_time != null
        ? Math.round(stats.average_process_time * 10) / 10
        : null,
    processRate:
      stats.average_process_rate >= 0 ? stats.average_process_rate : null,
    ts: stats.last_process_time ?? null,
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
