import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addStatusMetricSamples } from '@/shared/store/slices/monitoredFilterSlice';
import { buildStatusMetricKey } from '../../../types/statusMetric';

type GraphableMetric = { key: string; rawValue: number | null };

export const useCollectStatusMetricSamples = (
  filterIdx: number,
  graphableMetrics: GraphableMetric[],
  tickUs: number,
): void => {
  const dispatch = useDispatch();
  useEffect(() => {
    if (graphableMetrics.length === 0) return;
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
  }, [filterIdx, tickUs, dispatch]);
};
