import type { PIDproperties } from '@/types/domain/gpac/filter-stats';
import { pidPropertiesEqual } from './filterStatsEqual';

export type PidCache = Map<string, PIDproperties>;

// Reuses the previous PID object per key when unchanged, so PIDTableRow's memo holds.
export function stablePidList(
  cache: PidCache,
  pids: Record<string, PIDproperties> | undefined,
): PIDproperties[] {
  if (!pids) {
    cache.clear();
    return [];
  }

  const sortedKeys = Object.keys(pids).sort();
  const seenKeys = new Set<string>();

  const result = sortedKeys.map((key) => {
    seenKeys.add(key);
    const pid = pids[key];
    const cached = cache.get(key);

    if (cached && pidPropertiesEqual(cached, pid)) {
      return cached;
    }

    cache.set(key, pid);
    return pid;
  });

  for (const key of cache.keys()) {
    if (!seenKeys.has(key)) cache.delete(key);
  }

  return result;
}
