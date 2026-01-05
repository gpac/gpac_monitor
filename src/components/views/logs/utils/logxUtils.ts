/**
 * Utilities for logx mode (thread_id, caller mapping, colors)
 */

import { GpacLogEntry } from '@/types/domain/gpac/log-types';

/**
 * Color palette for deterministic thread/caller coloring
 */
const COLOR_PALETTE = [
  'bg-blue-500/20 text-blue-300',
  'bg-green-500/20 text-green-300',
  'bg-yellow-500/20 text-yellow-300',
  'bg-purple-500/20 text-purple-300',
  'bg-pink-500/20 text-pink-300',
  'bg-indigo-500/20 text-indigo-300',
  'bg-cyan-500/20 text-cyan-300',
  'bg-orange-500/20 text-orange-300',
] as const;

/**
 * Generate deterministic color based on string/number
 */
function hashToColor(value: string | number): string {
  const str = String(value);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
}

/**
 * Get display label for caller (filter identifier)
 */
export function getCallerLabel(
  caller: string | number | null | undefined,
): string | null {
  if (caller === null || caller === undefined) return null;
  return String(caller);
}

/**
 * Get display label for thread_id
 */
export function getThreadLabel(threadId: number | undefined): string | null {
  if (threadId === undefined) return null;
  return `T${threadId}`;
}

/**
 * Get deterministic color class for caller
 */
export function getCallerColor(
  caller: string | number | null | undefined,
): string {
  if (caller === null || caller === undefined) return '';
  return hashToColor(caller);
}

/**
 * Get deterministic color class for thread_id
 */
export function getThreadColor(threadId: number | undefined): string {
  if (threadId === undefined) return '';
  return hashToColor(threadId);
}

/**
 * Check if log has logx data (thread_id or caller)
 */
export function hasLogxData(log: GpacLogEntry): boolean {
  return log.thread_id !== undefined || log.caller !== undefined;
}
