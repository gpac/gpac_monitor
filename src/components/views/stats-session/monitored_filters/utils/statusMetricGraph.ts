import type { StatusNum } from '@/workers/filterStatusParser';

export function isGraphableStatusMetric(entry: StatusNum): boolean {
  if (entry.fraction) return false;
  if (!Number.isFinite(entry.value)) return false;
  if (entry.key === 'pc' || entry.unit === 'pc') return false;
  return true;
}
