import { useMemo } from 'react';
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

export function useCPUStatsHistory(): CPUStatsResult {
  const systemStats = useSelector(selectSystemStats);

  return useMemo(() => {
    if (!systemStats) {
      return {
        stats: [],
        isSubscribed: false,
        currentCPU: 0,
        currentMemory: 0,
        totalCores: 0,
      };
    }
    return {
      stats: [systemStats],
      isSubscribed: true,
      currentCPU: systemStats.process_cpu_usage ?? 0,
      currentMemory: systemStats.process_memory ?? 0,
      totalCores: systemStats.nb_cores ?? 0,
    };
  }, [systemStats]);
}
