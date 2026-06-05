import { memo, useMemo } from 'react';
import type uPlot from 'uplot';
import { type SeriesDef } from '@/components/common/charts';
import { formatChartTimeFromUs } from '@/utils/formatting';
import type { PIDMetricMode, PIDMetricSample } from '../../types/pid';
import { MODE_FORMATTERS, extractValue } from './config/pidHistoryChartConfig';
import LineHistoryChart from './LineHistoryChart';

export interface PIDSeriesEntry {
  pidHistory: PIDMetricSample[];
  label: string;
  color: string;
  metricLabel?: string;
}

interface PIDHistoryChartProps {
  entries: PIDSeriesEntry[];
  mode: PIDMetricMode;
  showEndLabels?: boolean;
  showCurrentTime?: boolean;
}

const PIDHistoryChart = memo(
  ({
    entries,
    mode,
    showEndLabels,
    showCurrentTime = true,
  }: PIDHistoryChartProps) => {
    const series = useMemo<SeriesDef[]>(
      () =>
        entries.map((entry) => ({
          label: entry.label,
          color: entry.color,
          formatValue: MODE_FORMATTERS[mode],
          fill: `${entry.color}15`,
          strokeWidth: 1.5,
          metricLabel: entry.metricLabel,
        })),
      [entries, mode],
    );

    const shouldShowEndLabels = showEndLabels ?? entries.length < 2;

    const { data, timeLabels } = useMemo(() => {
      const maxLen = Math.max(
        ...entries.map((entry) => entry.pidHistory.length),
        0,
      );
      if (maxLen === 0) {
        return {
          data: [[0], ...entries.map(() => [null])] as uPlot.AlignedData,
          timeLabels: [] as string[],
        };
      }

      const indices = Array.from({ length: maxLen }, (_, idx) => idx);
      const longest = entries.reduce(
        (acc, entry) =>
          entry.pidHistory.length >= acc.pidHistory.length ? entry : acc,
        entries[0],
      );
      const labels = longest.pidHistory.map((sample) =>
        formatChartTimeFromUs(sample.sessionTimestampUs),
      );

      const valueCols = entries.map((entry) => {
        const offset = maxLen - entry.pidHistory.length;
        return indices.map((i) => {
          const j = i - offset;
          return j < 0 ? null : extractValue(entry.pidHistory[j], mode);
        });
      });

      return {
        data: [indices, ...valueCols] as uPlot.AlignedData,
        timeLabels: labels,
      };
    }, [entries, mode]);

    return (
      <LineHistoryChart
        series={series}
        data={data}
        timeLabels={timeLabels}
        leftAxisFormat={MODE_FORMATTERS[mode]}
        showCurrentTime={showCurrentTime}
        showEndLabels={shouldShowEndLabels}
      />
    );
  },
);

PIDHistoryChart.displayName = 'PIDHistoryChart';

export default PIDHistoryChart;
