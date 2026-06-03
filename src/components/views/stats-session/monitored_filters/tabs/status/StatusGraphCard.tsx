import { memo } from 'react';
import { useAppSelector } from '@/shared/hooks/redux';
import { useChartDuration } from '@/shared/hooks';
import { selectSelectedStatusMetric } from '@/shared/store/selectors';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { WindowDurationBadge } from '@/components/common/WindowDurationBadge';
import { useIsDetached } from '../../FilterViewContext';
import type { NumericMetric } from '../../utils/statusViewModel';
import StatusMetricSelector from './StatusMetricSelector';
import StatusGraphPanel from './StatusGraphPanel';

interface StatusGraphCardProps {
  metrics: NumericMetric[];
  filterIdx: number;
  filterName: string;
}

const StatusGraphCard = memo(
  ({ metrics, filterIdx, filterName }: StatusGraphCardProps) => {
    const storedKey = useAppSelector((state) =>
      selectSelectedStatusMetric(state, filterIdx),
    );
    const firstGraphableKey = metrics.find((metric) => metric.graphable)?.key;
    const metricKey = storedKey ?? firstGraphableKey ?? null;
    const isDetached = useIsDetached();
    const { duration, setDuration, maxPoints } = useChartDuration(
      'status_graph_duration',
      '5min',
      1000,
    );

    return (
      <Card className="bg-monitor-panel border-t-monitor-line border-transparent">
        <CardHeader className="pb-1 px-3 pt-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Status
              <span className="mx-1 opacity-40">·</span>
              <span className="normal-case font-normal">
                Select a graphable metric
              </span>
            </p>
            {!isDetached && (
              <WindowDurationBadge
                value={duration}
                onChange={setDuration}
                options={['1min', '5min']}
              />
            )}
          </div>
          <StatusMetricSelector metrics={metrics} filterIdx={filterIdx} />
        </CardHeader>
        {metricKey && (
          <CardContent className="px-3 pb-2 pt-0">
            <p className="text-sm font-semibold text-foreground mb-1">
              {metricKey}
              <span className="mx-1 opacity-40">·</span>
              <span className="text-muted-foreground">{filterName}</span>
            </p>
            <StatusGraphPanel
              filterIdx={filterIdx}
              metricKey={metricKey}
              maxPoints={maxPoints}
            />
          </CardContent>
        )}
      </Card>
    );
  },
);

StatusGraphCard.displayName = 'StatusGraphCard';

export default StatusGraphCard;
