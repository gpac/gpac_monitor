import { memo, useMemo, useRef } from 'react';
import uPlot from 'uplot';
import { UplotChart } from '@/components/common/UplotChart';
import {
  createLineChartConfig,
  useContainerSize,
  type SeriesDef,
} from '@/components/common/charts';
import {
  formatBitrate,
  formatBufferTime,
  formatMicroseconds,
  formatPacketRate,
} from '@/utils/formatting';
import type { PIDMetricSample, PIDMetricMode } from '../../types/pid';

const CHART_HEIGHT = 140;

const MODE_FORMATTERS: Record<PIDMetricMode, (v: number) => string> = {
  bitrate: formatBitrate,
  buffer: formatBufferTime,
  processTime: formatMicroseconds,
  processRate: formatPacketRate,
  ts: formatMicroseconds,
};

const extractValue = (
  sample: PIDMetricSample,
  mode: PIDMetricMode,
): number | null => {
  switch (mode) {
    case 'bitrate':
      return sample.averageBitrate ?? null;
    case 'buffer':
      return sample.bufferTime ?? null;
    case 'processTime':
      return sample.processTime ?? null;
    case 'processRate':
      return sample.processRate ?? null;
    case 'ts':
      return sample.ts ?? null;
  }
};

export interface PIDSeriesEntry {
  pidHistory: PIDMetricSample[];
  label: string;
  color: string;
  metricLabel?: string;
}

interface PIDHistoryChartProps {
  entries: PIDSeriesEntry[];
  mode: PIDMetricMode;
}

const PIDHistoryChart = memo(({ entries, mode }: PIDHistoryChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensions = useContainerSize(containerRef);
  const timeLabelsRef = useRef<string[]>([]);

  const seriesKey = entries
    .map((entry) => `${entry.label}:${entry.color}:${entry.metricLabel ?? ''}`)
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

  const options = useMemo(
    () =>
      createLineChartConfig({
        series,
        timeLabelsRef,
        leftAxis: { formatY: MODE_FORMATTERS[mode] },
        ...dimensions,
      }),
    [series, dimensions, mode],
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
    timeLabelsRef.current = longest.pidHistory.map((s) =>
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
    <div ref={containerRef} style={{ width: '100%', height: CHART_HEIGHT }}>
      <UplotChart data={data} options={options} className="w-full h-full" />
    </div>
  );
});

PIDHistoryChart.displayName = 'PIDHistoryChart';

export default PIDHistoryChart;
