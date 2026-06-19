import type { ChartDataPoint } from '@/shared/store/slices/monitoredFilterSlice';

export interface PerfStatEntry {
  idx: number;
  bytes_sent: number;
  bytes_done: number;
  last_task_time?: number;
}

export type PerfSample = {
  filterId: string;
  outband: ChartDataPoint;
  inband: ChartDataPoint;
  lastTaskTime: ChartDataPoint;
};

export function buildPerfSamplesFromStats(
  stats: PerfStatEntry[],
  prevStats: Record<string, PerfStatEntry>,
  tsUs: number | null | undefined,
  prevTsUs: number | null,
  sessionStartUs: number | null,
): PerfSample[] {
  if (tsUs == null || prevTsUs == null || sessionStartUs == null) return [];
  const deltaSec = (tsUs - prevTsUs) / 1_000_000;
  if (deltaSec === 0) return [];

  const sessionTimeUs = tsUs - sessionStartUs;
  const samples: PerfSample[] = [];

  for (const stat of stats) {
    const filterId = String(stat.idx);
    const prev = prevStats[filterId];
    if (!prev) continue;

    samples.push({
      filterId,
      outband: {
        timestamp: sessionTimeUs,
        value: Math.max(0, (stat.bytes_sent - prev.bytes_sent) / deltaSec),
      },
      inband: {
        timestamp: sessionTimeUs,
        value: Math.max(0, (stat.bytes_done - prev.bytes_done) / deltaSec),
      },
      lastTaskTime: {
        timestamp: sessionTimeUs,
        value: stat.last_task_time ?? 0,
      },
    });
  }

  return samples;
}
