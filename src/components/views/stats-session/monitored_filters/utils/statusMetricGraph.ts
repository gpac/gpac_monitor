import type { StatusNum } from '@/workers/filterStatusParser';

/**
 * True when a parsed numeric status entry is a finite scalar worth plotting
 * on a time-series chart.
 *
 * Classification is type-driven: GPAC's metric type declaration (t=num / t=str / t=frac)
 * determines what the parser emits. Only StatusNum entries without a fraction reach this
 * function — str/bool/array entries are routed to dedicated renderers upstream.
 * Fraction entries (prog, buffer) are also excluded upstream before this is called.
 *
 * Note: str metrics with enum values (stateBadges) are candidates for histogram display
 * in a future iteration — not handled here.
 */
export function isGraphableStatusMetric(entry: StatusNum): boolean {
  if (entry.fraction) return false;
  if (!Number.isFinite(entry.value)) return false;
  return true;
}
