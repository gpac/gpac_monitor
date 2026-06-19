import type {
  StatusNum,
  ParsedFilterStatus,
} from '@/workers/filterStatusParser';
import { parseFilterStatus } from '@/workers/filterStatusParser';
import type { MetricDefinitionMap } from '@/workers/metricDefinitionParser';

export function isGraphableStatusMetric(entry: StatusNum): boolean {
  if (entry.fraction) return false;
  if (!Number.isFinite(entry.value)) return false;
  if (entry.key === 'pc' || entry.unit === 'pc') return false;
  return true;
}

export function extractGraphableStatusMetrics(
  parsed: ParsedFilterStatus,
): { key: string; value: number }[] {
  return parsed.entries
    .filter((entry): entry is StatusNum => entry.type === 'num')
    .filter(isGraphableStatusMetric)
    .map((entry) => ({ key: entry.key, value: entry.value }));
}

export function buildStatusSamplesFromParsed(
  parsedStatuses: Record<number, ParsedFilterStatus>,
  tsUs: number | null | undefined,
  sessionStartUs: number | null,
): Array<{
  key: string;
  sample: { sessionTimeUs: number; value: number | null };
}> {
  if (tsUs == null || sessionStartUs == null) return [];
  const sessionTimeUs = tsUs - sessionStartUs;
  const samples: Array<{
    key: string;
    sample: { sessionTimeUs: number; value: number | null };
  }> = [];
  for (const [idxStr, parsed] of Object.entries(parsedStatuses)) {
    const filterIdx = Number(idxStr);
    for (const { key, value } of extractGraphableStatusMetrics(parsed)) {
      samples.push({
        key: `${filterIdx}:${key}`,
        sample: { sessionTimeUs, value },
      });
    }
  }
  return samples;
}

export function buildStatusSamplesFromStats(
  stats: Array<{ idx: number; status?: string }>,
  tsUs: number | null | undefined,
  sessionStartUs: number | null,
  metricDefinitions?: MetricDefinitionMap,
): Array<{
  key: string;
  sample: { sessionTimeUs: number; value: number | null };
}> {
  const parsedStatuses: Record<number, ParsedFilterStatus> = {};
  for (const filter of stats) {
    parsedStatuses[filter.idx] = parseFilterStatus(
      filter.status ?? '',
      metricDefinitions,
    );
  }
  return buildStatusSamplesFromParsed(parsedStatuses, tsUs, sessionStartUs);
}
