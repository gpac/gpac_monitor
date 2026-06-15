import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addStatusMetricSamples } from '@/shared/store/slices/monitoredFilterSlice';
import {
  buildStatusMetricKey,
  type GraphableStatusMetric,
} from '../../../types/statusMetric';

export const useCollectStatusMetricSamplesLive = (
  filterIdx: number,
  graphableMetrics: GraphableStatusMetric[],
  tickUs: number,
  enabled: boolean,
): void => {
  const dispatch = useDispatch();
  useEffect(() => {
    if (!enabled || graphableMetrics.length === 0) return;
    dispatch(
      addStatusMetricSamples(
        graphableMetrics.map((metric) => ({
          key: buildStatusMetricKey(filterIdx, metric.key),
          sample: {
            sessionTimestampUs: Date.now() * 1000,
            value: metric.rawValue,
          },
        })),
      ),
    );
    // graphableMetrics read on each GPAC tick: tickUs drives the cadence
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterIdx, tickUs, enabled, dispatch]);
};
