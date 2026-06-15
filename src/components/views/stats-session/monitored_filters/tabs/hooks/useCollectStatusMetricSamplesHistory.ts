import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/shared/hooks/redux';
import { useDataSource } from '@/services/dataSource/DataSourceContext';
import { selectLastUpdateUs } from '@/shared/store/selectors';
import { formatCompactTime } from '@/utils/formatting';
import { addStatusMetricSamples } from '@/shared/store/slices/monitoredFilterSlice';
import {
  buildStatusMetricKey,
  type GraphableStatusMetric,
} from '../../../types/statusMetric';

export const useCollectStatusMetricSamplesHistory = (
  filterIdx: number,
  graphableMetrics: GraphableStatusMetric[],
  enabled: boolean,
): void => {
  const dispatch = useDispatch();
  const lastUpdateUs = useAppSelector(selectLastUpdateUs);
  const { manifest } = useDataSource();

  useEffect(() => {
    if (!enabled || graphableMetrics.length === 0) return;
    if (lastUpdateUs == null || manifest == null) return;

    const relativeUs = lastUpdateUs - manifest.startUs;
    dispatch(
      addStatusMetricSamples(
        graphableMetrics.map((metric) => ({
          key: buildStatusMetricKey(filterIdx, metric.key),
          sample: {
            sessionTimestampUs: relativeUs,
            value: metric.rawValue,
            time: formatCompactTime(relativeUs),
          },
        })),
      ),
    );
    // graphableMetrics read on each session_stats: lastUpdateUs drives the cadence
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterIdx, lastUpdateUs, enabled, dispatch]);
};
