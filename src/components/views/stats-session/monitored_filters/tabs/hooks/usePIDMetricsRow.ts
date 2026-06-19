import { useAppSelector } from '@/shared/hooks/redux';
import { selectPidColorIndexByKey } from '@/shared/store/selectors';
import type { PIDWithIndex } from '../../../types';
import { usePIDInfoStats } from './usePIDInfoStats';
import { usePIDBufferStats } from './usePIDBufferStats';
import { usePIDPerformanceStats } from './usePIDPerformanceStats';

export const usePIDMetricsRow = (pid: PIDWithIndex, pidKey: string) => {
  const infoStats = usePIDInfoStats(pid);
  const bufferStats = usePIDBufferStats(pid);
  const perfStats = usePIDPerformanceStats(pid);

  const colorIndex = useAppSelector(
    (state) => selectPidColorIndexByKey(state)[pidKey] ?? -1,
  );

  return {
    infoStats,
    bufferStats,
    perfStats,
    colorIndex,
    isSelected: colorIndex >= 0,
  };
};
