import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectSystemStatsHistory } from '@/shared/store/selectors/sessionDetails/sessionDetailsSelectors';

export interface CPUStatsResult {
  stats: import('@/types/domain/system').CPUStats[];
  isSubscribed: boolean;
  currentCPU: number;
  currentMemory: number;
  totalCores: number;
}

export function useCPUStatsHistory(): CPUStatsResult {
  const stats = useSelector(selectSystemStatsHistory);

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
