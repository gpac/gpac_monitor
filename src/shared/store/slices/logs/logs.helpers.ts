import { GpacLogEntry } from '@/types/domain/gpac/log-types';

/**
 * Extract all filter keys from a log entry
 * Returns array of keys: caller (if present) and thread_id (if present)
 * Used by both alert counting and filtering to ensure consistency
 */
export function getAlertKeysForLog(log: GpacLogEntry): string[] {
  const keys: string[] = [];

  // Add caller if present
  if (log.caller !== null && log.caller !== undefined) {
    keys.push(String(log.caller));
  }

  // Add thread_id if present
  if (log.thread_id !== undefined) {
    keys.push(`t:${log.thread_id}`);
  }

  return keys;
}

/**
 * Trim priority: log levels removed first on buffer overflow (left = first removed).
 * Unlisted levels (e.g., error=1) are protected and only removed as last resort.
 */
export const BUFFER_TRIM_PRIORITY: readonly number[] = [4, 3, 2]; // debug, info, warning

/** Smart trim: removes lowest-priority logs first, returns removed entries */
export function trimBuffer(
  buffer: GpacLogEntry[],
  overflow: number,
): GpacLogEntry[] {
  const removable = new Set<number>();
  for (const level of BUFFER_TRIM_PRIORITY) {
    removable.add(level);
    if (buffer.filter((l) => removable.has(l.level)).length >= overflow) break;
  }
  let toRemove = overflow;
  const kept: GpacLogEntry[] = [];
  const removed: GpacLogEntry[] = [];
  for (const log of buffer) {
    if (toRemove > 0 && removable.has(log.level)) {
      removed.push(log);
      toRemove--;
    } else kept.push(log);
  }
  if (toRemove > 0) removed.push(...kept.splice(0, toRemove));
  buffer.length = 0;
  buffer.push(...kept);
  return removed;
}
