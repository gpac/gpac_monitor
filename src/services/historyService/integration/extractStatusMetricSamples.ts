import type { SessionFilterStatistics } from '@/types/domain/gpac/filter-stats';
import type { StatusMetricSample } from '@/components/views/stats-session/types/statusMetric';
import { buildStatusMetricKey } from '@/components/views/stats-session/types/statusMetric';
import { parseFilterStatus } from '@/workers/filterStatusParser';
import { extractGraphableStatusMetrics } from '@/utils/metrics/statusMetricGraph';

export type StatusMetricSampleEntry = {
  key: string;
  sample: StatusMetricSample;
};
export type StatusMetricSamplesBuffer = StatusMetricSampleEntry[];

export function extractStatusMetricSamples(
  stats: SessionFilterStatistics[],
  tsUs: number,
  sessionStartUs: number,
): StatusMetricSampleEntry[] {
  const sessionTimeUs = tsUs - sessionStartUs;
  const samples: StatusMetricSampleEntry[] = [];

  for (const stat of stats) {
    if (!stat.status) continue;
    const parsed = parseFilterStatus(stat.status);
    const metrics = extractGraphableStatusMetrics(parsed);
    for (const metric of metrics) {
      samples.push({
        key: buildStatusMetricKey(stat.idx, metric.key),
        sample: { sessionTimeUs, value: metric.value },
      });
    }
  }
  return samples;
}
