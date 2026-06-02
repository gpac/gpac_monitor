import type { StatusNum } from '@/workers/filterStatusParser';

/**
 * Classifies which numeric status metrics are worth plotting on a time-series chart.
 *
 * Grounded in the GPAC status spec (tasks/doc/status/commit.md): cumulative counters
 * (elapsed time, frame/byte/packet totals) only ever grow, so a line chart is useless
 * for them. Only instantaneous values and rates (fps, queue depth, percentages, kbps
 * rates) carry meaning over time.
 */

/** Keys rendered by dedicated renderers (progress bar / buffer) — never plotted here. */
const NON_METRIC_KEYS = new Set(['prog', 'buffer']);

/** Keys that are inherently cumulative regardless of unit. */
const CUMULATIVE_KEYS = new Set(['time', 'frames', 'frame']);

/** Units denoting a growing count/total (bytes, frame count `f`, pixel count `p`). */
const CUMULATIVE_UNITS = new Set(['bytes', 'f', 'p']);

/** Substrings marking counter/total keys (e.g. r_bytes, s_pck, *_done, *_sent). */
const CUMULATIVE_KEY_FRAGMENTS = [
  'bytes',
  'pck',
  'packet',
  'count',
  'total',
  'done',
  'sent',
  'recv',
  'received',
];

function matchesCounterFragment(key: string): boolean {
  const lowerKey = key.toLowerCase();
  if (lowerKey.startsWith('nb')) return true;
  return CUMULATIVE_KEY_FRAGMENTS.some((fragment) =>
    lowerKey.includes(fragment),
  );
}

/**
 * True when a numeric metric is a cumulative counter (monotonically growing) and thus
 * not meaningful as a chart line.
 */
export function isCumulativeMetric(entry: StatusNum): boolean {
  if (CUMULATIVE_KEYS.has(entry.key)) return true;
  if (entry.unit && CUMULATIVE_UNITS.has(entry.unit)) return true;
  return matchesCounterFragment(entry.key);
}

/**
 * True when a numeric status metric is a finite instantaneous value / rate worth
 * plotting: a scalar (no fraction), not handled by another renderer, not cumulative.
 * Graphable examples: fps, queue depth (Q), percentages (pc, ohead), rates (kbps).
 */
export function isGraphableStatusMetric(entry: StatusNum): boolean {
  if (entry.type !== 'num') return false;
  if (entry.fraction) return false;
  if (!Number.isFinite(entry.value)) return false;
  if (NON_METRIC_KEYS.has(entry.key)) return false;
  return !isCumulativeMetric(entry);
}
