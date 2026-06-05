import { memo, useMemo } from 'react';
import type uPlot from 'uplot';
import { useAppSelector } from '@/shared/hooks/redux';
import { useChartDuration } from '@/shared/hooks';
import { selectSelectedStatusMetric } from '@/shared/store/selectors';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { WindowDurationBadge } from '@/components/common/WindowDurationBadge';
import { type SeriesDef } from '@/components/common/charts';
import { formatChartTimeFromUs } from '@/utils/formatting';
import { useIsDetached } from '../../FilterViewContext';
import type { NumericMetric } from '../../utils/statusViewModel';
import { buildStatusMetricKey } from '../../../types/statusMetric';
import { makeStatusValueFormatter } from '../../charts/config/statusMetricChartConfig';
import { PID_SELECTION_COLORS } from '../pid/utils/pidColors';
import LineHistoryChart from '../../charts/LineHistoryChart';
import StatusMetricSelector from './StatusMetricSelector';

interface StatusGraphCardProps {
  metrics: NumericMetric[];
  filterIdx: number;
  filterName: string;
}

const StatusGraphCard = memo(
  ({ metrics, filterIdx, filterName }: StatusGraphCardProps) => {
    const selectedKeys = useAppSelector((state) =>
      selectSelectedStatusMetric(state, filterIdx),
    );
    const statusMetricSamples = useAppSelector(
      (state) => state.monitoredFilter.statusMetricSamples,
    );
    const isDetached = useIsDetached();
    const { duration, setDuration, maxPoints } = useChartDuration(
      'status_graph_duration',
      '5min',
      1000,
    );

    const { series, data, timeLabels } = useMemo(() => {
      const allSamples = selectedKeys.map((key) => {
        const storeKey = buildStatusMetricKey(filterIdx, key);
        const samples = statusMetricSamples[storeKey] ?? [];
        return maxPoints != null ? samples.slice(-maxPoints) : samples;
      });

      const maxLen = Math.max(
        ...allSamples.map((samples) => samples.length),
        0,
      );

      if (maxLen === 0) {
        return {
          series: [] as SeriesDef[],
          data: [[0], ...selectedKeys.map(() => [null])] as uPlot.AlignedData,
          timeLabels: [] as string[],
        };
      }

      const indices = Array.from({ length: maxLen }, (_, idx) => idx);

      const longest = allSamples.reduce(
        (acc, samples) => (samples.length >= acc.length ? samples : acc),
        allSamples[0] ?? [],
      );

      const builtSeries: SeriesDef[] = selectedKeys.map((key, idx) => {
        const colorIndex = idx % PID_SELECTION_COLORS.length;
        const color = PID_SELECTION_COLORS[colorIndex];
        return {
          label: key,
          color,
          formatValue: makeStatusValueFormatter(),
          fill: `${color}15`,
          strokeWidth: 1.5,
        };
      });

      const valueCols = allSamples.map((samples) => {
        const offset = maxLen - samples.length;
        return indices.map((i) => {
          const j = i - offset;
          return j < 0 ? null : (samples[j]?.value ?? null);
        });
      });

      return {
        series: builtSeries,
        data: [indices, ...valueCols] as uPlot.AlignedData,
        timeLabels: longest.map((sample) =>
          formatChartTimeFromUs(sample.sessionTimestampUs),
        ),
      };
    }, [selectedKeys, statusMetricSamples, filterIdx, maxPoints]);

    return (
      <Card className="bg-monitor-panel border-t-monitor-line border-transparent">
        <CardHeader className="pb-1 px-3 pt-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Status
              <span className="mx-1 opacity-40">·</span>
              <span className="normal-case font-normal">{filterName}</span>
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
        {selectedKeys.length > 0 && (
          <CardContent className="px-3 pb-2 pt-0">
            <LineHistoryChart
              series={series}
              data={data}
              timeLabels={timeLabels}
              showCurrentTime
            />
          </CardContent>
        )}
      </Card>
    );
  },
);

StatusGraphCard.displayName = 'StatusGraphCard';

export default StatusGraphCard;
