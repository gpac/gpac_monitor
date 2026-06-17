import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addPIDSample } from '@/shared/store/slices/monitoredFilterSlice';
import type { PIDMetricSample } from '../../../types/pid';

type SampleMetrics = Omit<PIDMetricSample, 'sessionTimeUs'>;

export const usePIDSample = (pidKey: string, metrics: SampleMetrics): void => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(
      addPIDSample({
        key: pidKey,
        sample: { sessionTimeUs: Date.now() * 1000, ...metrics },
      }),
    );
  }, [
    pidKey,
    metrics.averageBitrate,
    metrics.bufferTime,
    metrics.processTime,
    metrics.processRate,
    metrics.ts,
    dispatch,
  ]);
};
