import type { PIDStats } from '@/types/domain/gpac/filter-stats';
import type { PIDMetricSample } from '@/components/views/stats-session/types/pid';
import { buildPIDKey } from '@/components/views/stats-session/types/pid';
import { tsFractionToSeconds } from '@/utils/formatting';

type DynamicPid = { buffer: number; stats?: PIDStats };

type FilterStatsPIDData = {
  idx: number;
  ipids?: Record<string, DynamicPid>;
  opids?: Record<string, DynamicPid>;
};

function pidSampleFrom(
  pid: DynamicPid,
  sessionTimeUs: number,
): PIDMetricSample {
  const stats = pid.stats;
  return {
    sessionTimeUs,
    bufferTime: stats?.buffer_time ?? pid.buffer,
    buffer: pid.buffer,
    averageBitrate:
      stats && stats.average_bitrate >= 0 ? stats.average_bitrate : null,
    processTime:
      stats?.average_process_time != null
        ? Math.round(stats.average_process_time * 10) / 10
        : null,
    processRate:
      stats && stats.average_process_rate >= 0
        ? stats.average_process_rate
        : null,
    ts: stats?.last_process_time ?? null,
    lastTsSent: stats ? tsFractionToSeconds(stats.last_ts_sent) : null,
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
