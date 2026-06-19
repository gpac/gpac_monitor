import { useMemo } from 'react';
import type uPlot from 'uplot';
import { useAppSelector } from '@/shared/hooks/redux';
import { type SeriesDef } from '@/components/common/charts';
import { buildStatusMetricKey } from '../../../types/statusMetric';
import { makeStatusValueFormatter } from '../config/statusMetricChartConfig';
import { PID_SELECTION_COLORS } from '../../tabs/pid/utils/pidColors';

interface StatusMetricChartData {
  series: SeriesDef[];
  data: uPlot.AlignedData;
}

export function useStatusMetricChartData(
  filterIdx: number,
  selectedKeys: string[],
  maxPoints: number | null,
): StatusMetricChartData {
  const statusMetricSamples = useAppSelector(
    (state) => state.monitoredFilter.statusMetricSamples,
  );

  const series = useMemo<SeriesDef[]>(
    () =>
      selectedKeys.map((key, index) => {
        const color = PID_SELECTION_COLORS[index % PID_SELECTION_COLORS.length];
        return {
          label: key,
          color,
          formatValue: makeStatusValueFormatter(),
          fill: `${color}15`,
          strokeWidth: 1.5,
        };
      }),
    [selectedKeys],
  );

  const data = useMemo((): uPlot.AlignedData => {
    const allSamples = selectedKeys.map((key) => {
      const storeKey = buildStatusMetricKey(filterIdx, key);
      const samples = statusMetricSamples[storeKey] ?? [];
      return maxPoints != null ? samples.slice(-maxPoints) : samples;
    });

    const maxLen = Math.max(...allSamples.map((samples) => samples.length), 0);

    if (maxLen === 0) {
      return [[0], ...selectedKeys.map(() => [null])] as uPlot.AlignedData;
    }

    const longest = allSamples.reduce(
      (acc, samples) => (samples.length >= acc.length ? samples : acc),
      allSamples[0] ?? [],
    );

    const longestOffset = maxLen - longest.length;
    const firstTs = longest[0]?.sessionTimeUs ?? 0;
    const xValues = Array.from({ length: maxLen }, (_, index) => {
      const j = index - longestOffset;
      return j >= 0 ? (longest[j]?.sessionTimeUs ?? firstTs) : firstTs;
    });

    const valueCols = allSamples.map((samples) => {
      const offset = maxLen - samples.length;
      return xValues.map((_, i) => {
        const j = i - offset;
        return j < 0 ? null : (samples[j]?.value ?? null);
      });
    });

    return [xValues, ...valueCols] as uPlot.AlignedData;
  }, [selectedKeys, statusMetricSamples, filterIdx, maxPoints]);

  return { series, data };
}
