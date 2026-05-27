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
  CHART_HEIGHT,
  buildUplotAlignedData,
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
      const { alignedData, timeLabels } = buildUplotAlignedData(entries, mode);
      timeLabelsRef.current = timeLabels;
      return alignedData;
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
          <UplotChart data={data} options={options} className="w-full h-full" />
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
