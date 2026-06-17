import type {
  StatusNum,
  ParsedFilterStatus,
} from '@/workers/filterStatusParser';

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
