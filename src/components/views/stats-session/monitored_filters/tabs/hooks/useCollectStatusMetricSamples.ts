import { useDataMode } from '@/shared/hooks/data/useDataMode';
import type { GraphableStatusMetric } from '../../../types/statusMetric';
import { useCollectStatusMetricSamplesHistory } from './useCollectStatusMetricSamplesHistory';
import { useCollectStatusMetricSamplesLive } from './useCollectStatusMetricSamplesLive';

export const useCollectStatusMetricSamples = (
  filterIdx: number,
  graphableMetrics: GraphableStatusMetric[],
  tickUs: number,
): void => {
  const { isHistory } = useDataMode();
  useCollectStatusMetricSamplesLive(
    filterIdx,
    graphableMetrics,
    tickUs,
    !isHistory,
  );
  useCollectStatusMetricSamplesHistory(filterIdx, graphableMetrics, isHistory);
};
