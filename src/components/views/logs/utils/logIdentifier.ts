import { GpacLogEntry } from '@/types/domain/gpac/log-types';
import { generateID } from '@/utils/core/id';

/**
 * Unique identifier for a log entry
 * Format: "${timestamp}_${nanoid}"
 */
export type LogId = string;

/**
 * Generate a unique ID for a log entry
 * Uses timestamp for context + nanoid for uniqueness
 */
export const generateLogId = (log: GpacLogEntry): LogId => {
  return `${log.timestamp}_${generateID()}`;
};
