import { useMemo } from 'react';
import type uPlot from 'uplot';
import type { SeriesDef } from '@/components/common/charts';

export interface SeriesInput {
  samples: { sessionTimeUs: number; value: number | null }[];
  label: string;
  color: string;
  formatValue?: (v: number) => string;
  fill?: string;
  strokeWidth?: number;
  metricLabel?: string;
  yAxis?: 'left' | 'right';
}

export interface AlignedChartDataOptions {
  windowUs?: number;
}

export function buildAlignedData(
  inputs: SeriesInput[],
  options?: AlignedChartDataOptions,
): { series: SeriesDef[]; data: uPlot.AlignedData } {
  const series: SeriesDef[] = inputs.map(
    ({ label, color, formatValue, fill, strokeWidth, metricLabel, yAxis }) => ({
      label,
      color,
      ...(formatValue ? { formatValue } : {}),
      ...(fill ? { fill } : {}),
      ...(strokeWidth != null ? { strokeWidth } : {}),
      ...(metricLabel ? { metricLabel } : {}),
      ...(yAxis ? { yAxis } : {}),
    }),
  );

  if (inputs.length === 0) {
    return { series, data: [[0]] as uPlot.AlignedData };
  }

  let filtered = inputs;
  if (options?.windowUs != null) {
    const lastUs = Math.max(
      0,
      ...inputs.flatMap((input) => input.samples.map((s) => s.sessionTimeUs)),
    );
    const cutoff = lastUs - options.windowUs;
    filtered = inputs.map((input) => ({
      ...input,
      samples: input.samples.filter((s) => s.sessionTimeUs >= cutoff),
    }));
  }

  const tsSet = new Set<number>();
  for (const input of filtered) {
    for (const sample of input.samples) {
      tsSet.add(sample.sessionTimeUs);
    }
  }
  const xs = Array.from(tsSet).sort((a, b) => a - b);

  if (xs.length === 0) {
    return {
      series,
      data: [[0], ...inputs.map(() => [null])] as uPlot.AlignedData,
    };
  }

  const cols = filtered.map((input) => {
    const byTs = new Map(input.samples.map((s) => [s.sessionTimeUs, s.value]));
    return xs.map((x) => byTs.get(x) ?? null);
  });

  return { series, data: [xs, ...cols] as uPlot.AlignedData };
}

export function useAlignedChartData(
  inputs: SeriesInput[],
  options?: AlignedChartDataOptions,
): { series: SeriesDef[]; data: uPlot.AlignedData } {
  return useMemo(
    () => buildAlignedData(inputs, options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inputs, options?.windowUs],
  );
}
