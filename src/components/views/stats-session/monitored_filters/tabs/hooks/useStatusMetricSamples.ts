import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addStatusMetricSamples } from '@/shared/store/slices/monitoredFilterSlice';
import { buildStatusMetricKey } from '../../../types/statusMetric';

type GraphableMetric = { key: string; rawValue: number | null };

export const useStatusMetricSamples = (
  filterIdx: number,
  graphableMetrics: GraphableMetric[],
): void => {
  const dispatch = useDispatch();
  const signature = graphableMetrics
    .map((metric) => `${metric.key}:${metric.rawValue}`)
    .join('|');

  useEffect(() => {
    if (graphableMetrics.length === 0) return;
    const sessionTimestampUs = Date.now() * 1000;
    dispatch(
      addStatusMetricSamples(
        graphableMetrics.map((metric) => ({
          key: buildStatusMetricKey(filterIdx, metric.key),
          sample: { sessionTimestampUs, value: metric.rawValue },
        })),
      ),
    );
    // graphableMetrics intentionally excluded: signature captures value changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterIdx, signature, dispatch]);
};
