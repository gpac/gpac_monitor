import { useMemo } from 'react';
import type uPlot from 'uplot';
import { useAppSelector } from '@/shared/hooks/redux';
import { type SeriesDef } from '@/components/common/charts';
import { formatChartTimeFromUs } from '@/utils/formatting';
import { buildStatusMetricKey } from '../../../types/statusMetric';
import { makeStatusValueFormatter } from '../config/statusMetricChartConfig';
import { PID_SELECTION_COLORS } from '../../tabs/pid/utils/pidColors';

interface StatusMetricChartData {
  series: SeriesDef[];
  data: uPlot.AlignedData;
  timeLabels: string[];
}

export function useStatusMetricChartData(
  filterIdx: number,
  selectedKeys: string[],
  maxPoints: number | null,
): StatusMetricChartData {
  const statusMetricSamples = useAppSelector(
    (state) => state.monitoredFilter.statusMetricSamples,
  );

  return useMemo(() => {
    const allSamples = selectedKeys.map((key) => {
      const storeKey = buildStatusMetricKey(filterIdx, key);
      const samples = statusMetricSamples[storeKey] ?? [];
      return maxPoints != null ? samples.slice(-maxPoints) : samples;
    });

    const maxLen = Math.max(...allSamples.map((samples) => samples.length), 0);

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

    const series: SeriesDef[] = selectedKeys.map((key, idx) => {
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
      series,
      data: [indices, ...valueCols] as uPlot.AlignedData,
      timeLabels: longest.map((sample) =>
        formatChartTimeFromUs(sample.sessionTimestampUs),
      ),
    };
  }, [selectedKeys, statusMetricSamples, filterIdx, maxPoints]);
}
