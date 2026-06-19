import { useMemo, useRef } from 'react';
import type uPlot from 'uplot';
import { type SeriesDef } from '@/components/common/charts';
import type { PIDMetricMode, PIDMetricSample } from '../../../types/pid';
import { MODE_FORMATTERS, extractValue } from '../config/pidHistoryChartConfig';

export interface PIDSeriesEntry {
  pidHistory: PIDMetricSample[];
  label: string;
  color: string;
  metricLabel?: string;
}

export function usePIDChartData(
  entries: PIDSeriesEntry[],
  mode: PIDMetricMode,
) {
  const seriesCacheRef = useRef<{ key: string; value: SeriesDef[] }>({
    key: '',
    value: [],
  });
  const seriesKey =
    mode +
    '|' +
    entries
      .map(
        (entry) => `${entry.label}|${entry.color}|${entry.metricLabel ?? ''}`,
      )
      .join(',');

  if (seriesCacheRef.current.key !== seriesKey) {
    seriesCacheRef.current = {
      key: seriesKey,
      value: entries.map((entry) => ({
        label: entry.label,
        color: entry.color,
        formatValue: MODE_FORMATTERS[mode],
        fill: `${entry.color}15`,
        strokeWidth: 1.5,
        metricLabel: entry.metricLabel,
      })),
    };
  }

  const series = seriesCacheRef.current.value;

  const data = useMemo((): uPlot.AlignedData => {
    const maxLen = Math.max(
      ...entries.map((entry) => entry.pidHistory.length),
      0,
    );
    if (maxLen === 0) {
      return [[0], ...entries.map(() => [null])] as uPlot.AlignedData;
    }

    const longest = entries.reduce(
      (acc, entry) =>
        entry.pidHistory.length >= acc.pidHistory.length ? entry : acc,
      entries[0],
    );

    const longestOffset = maxLen - longest.pidHistory.length;
    const firstTs = longest.pidHistory[0]?.sessionTimeUs ?? 0;
    const xValues = Array.from({ length: maxLen }, (_, index) => {
      const j = index - longestOffset;
      return j >= 0
        ? (longest.pidHistory[j]?.sessionTimeUs ?? firstTs)
        : firstTs;
    });

    const valueCols = entries.map((entry) => {
      const offset = maxLen - entry.pidHistory.length;
      return xValues.map((_, idx) => {
        const j = idx - offset;
        return j < 0 ? null : extractValue(entry.pidHistory[j], mode);
      });
    });

    return [xValues, ...valueCols] as uPlot.AlignedData;
  }, [entries, mode]);

  return { series, data };
}
