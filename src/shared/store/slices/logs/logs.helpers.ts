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
