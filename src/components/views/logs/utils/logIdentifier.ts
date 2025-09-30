import { GpacLogEntry } from '@/types/domain/gpac/log-types';

/**
 * Unique identifier for a log entry
 * Format: "${timestamp}_${hash}"
 */
export type LogId = string;

/**
 * Generate a simple hash from a string
 * Uses bitwise operations for fast hashing
 */
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
};

/**
 * Generate a unique and stable ID for a log entry
 * The ID is based on timestamp and message hash
 * This ensures the same log always gets the same ID
 */
export const generateLogId = (log: GpacLogEntry): LogId => {
  const msgHash = simpleHash(log.message);
  return `${log.timestamp}_${msgHash}`;
};
