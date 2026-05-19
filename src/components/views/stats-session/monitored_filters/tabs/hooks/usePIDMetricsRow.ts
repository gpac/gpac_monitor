import { useAppSelector } from '@/shared/hooks/redux';
import { selectPidColorIndexByKey } from '@/shared/store/selectors';
import type { PIDWithIndex } from '../../../types';
import { usePIDInfoStats } from './usePIDInfoStats';
import { usePIDBufferStats } from './usePIDBufferStats';
import { usePIDPerformanceStats } from './usePIDPerformanceStats';
import { usePIDSample } from './usePIDSample';

export const usePIDMetricsRow = (pid: PIDWithIndex, pidKey: string) => {
  const infoStats = usePIDInfoStats(pid);
  const bufferStats = usePIDBufferStats(pid);
  const perfStats = usePIDPerformanceStats(pid);

  usePIDSample(pidKey, {
    averageBitrate: perfStats.average_bitrate,
    bufferTime: bufferStats.displayBuffer,
    processTime: perfStats.average_process_time,
    processRate: perfStats.average_process_rate,
  });

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
