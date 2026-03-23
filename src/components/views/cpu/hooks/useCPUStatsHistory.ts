import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectSystemStats } from '@/shared/store/selectors/sessionDetails/sessionDetailsSelectors';
import type { CPUStats } from '@/types/domain/system';

export interface CPUStatsResult {
  stats: CPUStats[];
  isSubscribed: boolean;
  currentCPU: number;
  currentMemory: number;
  totalCores: number;
}

const MAX_POINTS = 300;

export function useCPUStatsHistory(): CPUStatsResult {
  const systemStats = useSelector(selectSystemStats);
  const [stats, setStats] = useState<CPUStats[]>([]);
  const prevTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (!systemStats) {
      setStats([]);
      prevTimestampRef.current = null;
      return;
    }
    // Guard: skip if same timestamp (snapshot hydration re-renders)
    if (systemStats.timestamp === prevTimestampRef.current) return;
    prevTimestampRef.current = systemStats.timestamp;

    setStats((prev) => {
      const next = [...prev, systemStats];
      return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next;
    });
  }, [systemStats]);

  return useMemo(() => {
    const last = stats[stats.length - 1];
    return {
      stats,
      isSubscribed: stats.length > 0,
      currentCPU: last?.process_cpu_usage ?? 0,
      currentMemory: last?.process_memory ?? 0,
      totalCores: last?.nb_cores ?? 0,
    };
  }, [stats]);
}
