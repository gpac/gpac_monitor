import { useMemo, useRef } from 'react';
import { useFilterStats } from '@/components/views/stats-session/hooks/stats/useFilterStats';
import { PidProperty } from '@/types';

const EMPTY: PidProperty[] = [];

/**
 * Custom hook to get PID properties from periodic filter stats.
 * Properties auto-update on source switch (no on-demand fetch needed).
 */
export const useFetchIPIDProperties = (
  filterIdx: number | undefined,
  ipidIdx: number | undefined,
) => {
  const { stats } = useFilterStats(filterIdx, filterIdx !== undefined);
  const prevRef = useRef<PidProperty[]>(EMPTY);

  return useMemo(() => {
    if (!stats?.ipids || ipidIdx === undefined) return EMPTY;
    const entry = Object.values(stats.ipids)[ipidIdx];
    if (!entry?.properties) return prevRef.current;
    const next = Object.values(entry.properties) as PidProperty[];
    // Stabilize reference: only update if a value actually changed
    if (
      next.length === prevRef.current.length &&
      next.every((p, i) => p.value === prevRef.current[i]?.value)
    ) {
      return prevRef.current;
    }
    prevRef.current = next;
    return next;
  }, [stats?.ipids, ipidIdx]);
};
