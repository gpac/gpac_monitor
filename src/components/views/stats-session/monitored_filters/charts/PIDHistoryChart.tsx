import { memo, useMemo, useRef, useState } from 'react';
import uPlot from 'uplot';
import { UplotChart } from '@/components/common/UplotChart';
import {
  createLineChartConfig,
  useContainerSize,
  type SeriesDef,
  type EndLabelInfo,
} from '@/components/common/charts';
import type { PIDMetricMode, PIDMetricSample } from '../../types/pid';
import {
  MODE_FORMATTERS,
  extractValue,
  CHART_HEIGHT,
} from './config/pidHistoryChartConfig';

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
  showSessionTimeLabel?: boolean;
}

const PIDHistoryChart = memo(
  ({
    entries,
    mode,
    showEndLabels,
    showCurrentTime = true,
    showSessionTimeLabel = false,
  }: PIDHistoryChartProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const dimensions = useContainerSize(containerRef);
    const timeLabelsRef = useRef<string[]>([]);
    const [endLabels, setEndLabels] = useState<EndLabelInfo[]>([]);

    const seriesKey = entries
      .map(
        (entry) => `${entry.label}:${entry.color}:${entry.metricLabel ?? ''}`,
      )
      .join('|');

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
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [seriesKey, mode],
    );

    const shouldShowEndLabels = showEndLabels ?? entries.length < 2;

    const options = useMemo(
      () =>
        createLineChartConfig({
          series,
          timeLabelsRef,
          leftAxis: { formatY: MODE_FORMATTERS[mode] },
          onEndLabels: shouldShowEndLabels ? setEndLabels : undefined,
          ...dimensions,
        }),

      [series, dimensions, mode, shouldShowEndLabels],
    );

    const data = useMemo<uPlot.AlignedData>(() => {
      const maxLen = Math.max(...entries.map((e) => e.pidHistory.length), 0);
      if (maxLen === 0) {
        timeLabelsRef.current = [];
        return [[0], ...entries.map(() => [null])] as uPlot.AlignedData;
      }

      const indices = Array.from({ length: maxLen }, (_, i) => i);
      const longest = entries.reduce(
        (acc, entry) =>
          entry.pidHistory.length >= acc.pidHistory.length ? entry : acc,
        entries[0],
      );
      timeLabelsRef.current = longest.pidHistory.map(
        (s) =>
          s.time ??
          new Date(s.sessionTimestampUs / 1000).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
      );

      const valueCols = entries.map((entry) => {
        const offset = maxLen - entry.pidHistory.length;
        return indices.map((i) => {
          const j = i - offset;
          return j < 0 ? null : extractValue(entry.pidHistory[j], mode);
        });
      });

      return [indices, ...valueCols] as uPlot.AlignedData;
    }, [entries, mode]);

    return (
      <div
        style={{ width: '100%' }}
        className="flex flex-col justify-items-end"
      >
        {showCurrentTime && timeLabelsRef.current.length > 0 && (
          <div className="w-full text-right font-mono text-xs opacity-60 mb-1">
            {showSessionTimeLabel && (
              <span className="opacity-60 mr-1">Session time:</span>
            )}
            {timeLabelsRef.current[timeLabelsRef.current.length - 1]}
          </div>
        )}
        <div
          ref={containerRef}
          style={{ width: '100%', height: CHART_HEIGHT, position: 'relative' }}
        >
          <UplotChart
            data={data}
            options={options}
            className="w-12/12 h-full"
          />
          {endLabels.map((endLabel, index) => {
            const clampedTop = Math.min(
              Math.max(endLabel.top, 0),
              CHART_HEIGHT - 16,
            );
            return (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  top: clampedTop,
                  right: 2,
                  transform: 'translateY(-50%)',
                  border: `1px solid ${endLabel.color}`,
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
                className="bg-gray-900 text-[10px] font-mono leading-none text-info px-1 py-0.5 rounded"
              >
                <span className="opacity-70">{endLabel.label}</span>{' '}
                {endLabel.value}
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

PIDHistoryChart.displayName = 'PIDHistoryChart';

export default PIDHistoryChart;
