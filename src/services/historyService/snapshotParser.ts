import type { HistorySnapshot } from './types';

export function parseSnapshot(raw: unknown): HistorySnapshot {
  if (
    !raw ||
    typeof raw !== 'object' ||
    !Array.isArray((raw as { filters?: unknown }).filters)
  ) {
    throw new Error('[SnapshotParser] snapshot must have a filters array');
  }
  return raw as HistorySnapshot;
}
