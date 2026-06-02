import { memo, useMemo } from 'react';
import { useAppSelector } from '@/shared/hooks/redux';
import { selectStatusMetricSamples } from '@/shared/store/selectors';
import StatusMetricHistoryChart from '../../charts/StatusMetricHistoryChart';

interface StatusGraphPanelProps {
  filterIdx: number;
  metricKey: string;
  unit?: string;
  maxPoints?: number;
}

const StatusGraphPanel = memo(
  ({ filterIdx, metricKey, unit, maxPoints }: StatusGraphPanelProps) => {
    const samples = useAppSelector((state) =>
      selectStatusMetricSamples(state, filterIdx, metricKey),
    );

    const sliced = useMemo(
      () => (maxPoints != null ? samples.slice(-maxPoints) : samples),
      [samples, maxPoints],
    );

    return (
      <div className="p-2">
        <StatusMetricHistoryChart
          samples={sliced}
          label={metricKey}
          unit={unit}
          showCurrentTime
        />
      </div>
    );
  },
);

StatusGraphPanel.displayName = 'StatusGraphPanel';

export default StatusGraphPanel;
