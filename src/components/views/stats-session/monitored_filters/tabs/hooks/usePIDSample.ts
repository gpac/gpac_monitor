import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addPIDSample } from '@/shared/store/slices/monitoredFilterSlice';
import { useDataMode } from '@/shared/hooks/data/useDataMode';
import type { PIDMetricSample } from '../../../types/pid';

type SampleMetrics = Omit<PIDMetricSample, 'sessionTimestampUs'>;

export const usePIDSample = (pidKey: string, metrics: SampleMetrics): void => {
  const dispatch = useDispatch();
  const { isHistory } = useDataMode();
  useEffect(() => {
    if (isHistory) return;
    dispatch(
      addPIDSample({
        key: pidKey,
        sample: { sessionTimestampUs: Date.now() * 1000, ...metrics },
      }),
    );
  }, [
    isHistory,
    pidKey,
    metrics.averageBitrate,
    metrics.bufferTime,
    metrics.processTime,
    metrics.processRate,
    metrics.ts,
    dispatch,
  ]);
};
