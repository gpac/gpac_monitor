import { memo } from 'react';
import { useAppSelector } from '@/shared/hooks/redux';
import { useChartDuration } from '@/shared/hooks';
import { selectSelectedStatusMetric } from '@/shared/store/selectors';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { WindowDurationBadge } from '@/components/common/WindowDurationBadge';
import { useIsDetached } from '../../FilterViewContext';
import StatusGraphPanel from './StatusGraphPanel';

interface StatusGraphSectionProps {
  filterIdx: number;
  filterName: string;
}

const StatusGraphSection = memo(
  ({ filterIdx, filterName }: StatusGraphSectionProps) => {
    const metricKey = useAppSelector((state) =>
      selectSelectedStatusMetric(state, filterIdx),
    );
    const isDetached = useIsDetached();
    const { duration, setDuration, maxPoints } = useChartDuration(
      'status_graph_duration',
      '5min',
      1000,
    );

    if (!metricKey) return null;

    return (
      <Card className="bg-monitor-panel border-t-monitor-line border-transparent">
        <CardHeader className="pb-1 px-3 pt-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              {metricKey}
              <span className="mx-1 opacity-40">·</span>
              <span className="text-muted-foreground">{filterName}</span>
            </p>
            {!isDetached && (
              <WindowDurationBadge
                value={duration}
                onChange={setDuration}
                options={['1min', '5min']}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-2 pt-0">
          <StatusGraphPanel
            filterIdx={filterIdx}
            metricKey={metricKey}
            maxPoints={maxPoints}
          />
        </CardContent>
      </Card>
    );
  },
);

StatusGraphSection.displayName = 'StatusGraphSection';

export default StatusGraphSection;
