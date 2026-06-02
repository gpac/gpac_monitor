import { memo, useMemo } from 'react';
import uPlot from 'uplot';
import { type SeriesDef } from '@/components/common/charts';
import { formatClockTime } from '@/utils/formatting';
import type { StatusMetricSample } from '../../types/statusMetric';
import LineHistoryChart from './LineHistoryChart';
import {
  STATUS_METRIC_COLOR,
  makeStatusValueFormatter,
} from './config/statusMetricChartConfig';

interface StatusMetricHistoryChartProps {
  samples: StatusMetricSample[];
  label: string;
  unit?: string;
  showCurrentTime?: boolean;
}

const StatusMetricHistoryChart = memo(
  ({
    samples,
    label,
    unit,
    showCurrentTime,
  }: StatusMetricHistoryChartProps) => {
    const formatValue = useMemo(() => makeStatusValueFormatter(unit), [unit]);

    const series = useMemo<SeriesDef[]>(
      () => [
        {
          label,
          color: STATUS_METRIC_COLOR,
          formatValue,
          fill: `${STATUS_METRIC_COLOR}15`,
          strokeWidth: 1.5,
        },
      ],
      [label, formatValue],
    );

    const { data, timeLabels } = useMemo(() => {
      if (samples.length === 0) {
        return {
          data: [[0], [null]] as uPlot.AlignedData,
          timeLabels: [] as string[],
        };
      }
      const indices = samples.map((_, index) => index);
      return {
        data: [
          indices,
          samples.map((sample) => sample.value),
        ] as uPlot.AlignedData,
        timeLabels: samples.map((sample) =>
          formatClockTime(sample.sessionTimestampUs / 1000),
        ),
      };
    }, [samples]);

    return (
      <LineHistoryChart
        series={series}
        data={data}
        timeLabels={timeLabels}
        leftAxisFormat={formatValue}
        showCurrentTime={showCurrentTime}
      />
    );
  },
);

StatusMetricHistoryChart.displayName = 'StatusMetricHistoryChart';

export default StatusMetricHistoryChart;
