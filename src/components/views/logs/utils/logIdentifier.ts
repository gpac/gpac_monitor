import { nanoid } from 'nanoid';
import type { GpacLogEntry, LogId } from '@/types/domain/gpac/log-types';

export type { LogId } from '@/types/domain/gpac/log-types';

// External cache: key = log object, value = ID
const logIdCache = new WeakMap<GpacLogEntry, LogId>();

/**
 * Returns a stable ID for a log entry.
 * - First call for a given log → generates `${timestamp}_${nanoid(6)}`
 * - Subsequent calls on the same object → returns the same ID
 * - NO mutation of the log object (compatible with Redux/Immer)
 */
export const generateLogId = (log: GpacLogEntry): LogId => {
  let id = logIdCache.get(log);

  if (!id) {
    id = `${log.timestamp}_${nanoid(6)}`;
    logIdCache.set(log, id);
  }

  return id;
};
