import type {
  SessionFilterStatistics,
  PIDDynamicData,
} from '@/types/domain/gpac/filter-stats';
import type { PIDMetricSample } from '@/components/views/stats-session/types/pid';
import { buildPIDKey } from '@/components/views/stats-session/types/pid';
import { tsToSeconds } from '@/utils/formatting/time';

export type PIDSample = { key: string; sample: PIDMetricSample };
export type PIDDynamicByFilter = Record<
  string,
  {
    ipids?: Record<string, PIDDynamicData>;
    opids?: Record<string, PIDDynamicData>;
  }
>;

/** Graph chart samples — 5 series mapped to PIDMetricSample */
export function extractPIDSamples(
  stats: SessionFilterStatistics[],
  tsUs: number,
  sessionStartUs: number,
): PIDSample[] {
  const sessionTimeUs = tsUs - sessionStartUs;
  const samples: PIDSample[] = [];

  for (const stat of stats) {
    if (stat.ipids) {
      Object.values(stat.ipids).forEach((pid, pidIndex) => {
        samples.push({
          key: buildPIDKey(stat.idx, 'input', pidIndex),
          sample: {
            sessionTimeUs,
            averageBitrate: pid.stats?.average_bitrate ?? null,
            bufferTime: pid.stats?.buffer_time ?? null,
            processTime: pid.stats?.average_process_time ?? null,
            processRate: pid.stats?.average_process_rate ?? null,
            ts: tsToSeconds(pid.stats?.last_ts_sent),
          },
        });
      });
    }
    if (stat.opids) {
      Object.values(stat.opids).forEach((pid, pidIndex) => {
        samples.push({
          key: buildPIDKey(stat.idx, 'output', pidIndex),
          sample: {
            sessionTimeUs,
            averageBitrate: pid.stats?.average_bitrate ?? null,
            bufferTime: pid.stats?.buffer_time ?? null,
            processTime: pid.stats?.average_process_time ?? null,
            processRate: pid.stats?.average_process_rate ?? null,
            ts: tsToSeconds(pid.stats?.last_ts_sent),
          },
        });
      });
    }
  }
  return samples;
}

/**
 * Full dynamic PID data for table + tooltip (buffer, bitrate, full PIDStats).
 * Feeds setFilterPids → pidsByFilter → usePIDBufferStats / usePIDPerformanceStats.
 */
export function extractPIDDynamic(
  stats: SessionFilterStatistics[],
): PIDDynamicByFilter {
  const result: PIDDynamicByFilter = {};
  for (const stat of stats) {
    const filterKey = stat.idx.toString();
    if (stat.ipids && Object.keys(stat.ipids).length > 0) {
      result[filterKey] = result[filterKey] ?? {};
      result[filterKey].ipids = stat.ipids;
    }
    if (stat.opids && Object.keys(stat.opids).length > 0) {
      result[filterKey] = result[filterKey] ?? {};
      result[filterKey].opids = stat.opids;
    }
  }
  return result;
}
