import { memo, useMemo } from 'react';
import uPlot from 'uplot';
import { UplotChart } from '@/components/common/UplotChart';
import type { PIDMetricSample, PIDMetricMode } from '../../types/pid';

interface PIDHistoryChartProps {
  history: PIDMetricSample[];
  mode: PIDMetricMode;
  label: string;
  color?: string;
}

const DEFAULT_COLOR = '#3b82f6';

const extractValue = (
  sample: PIDMetricSample,
  mode: PIDMetricMode,
): number | null => {
  switch (mode) {
    case 'bitrate':
      return sample.average_bitrate ?? null;
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

const buildChartOptions = (label: string, color: string): uPlot.Options => ({
  width: 300,
  height: 80,
  scales: { x: { time: true } },
  axes: [{ show: false }, { show: false }],
  series: [
    {},
    {
      label,
      stroke: color,
      fill: `${color}20`,
      width: 1.5,
      spanGaps: false,
    },
  ],
  legend: { show: false },
  cursor: { show: false },
  padding: [4, 0, 0, 0],
});

const PIDHistoryChart = memo(
  ({ history, mode, label, color = DEFAULT_COLOR }: PIDHistoryChartProps) => {
    const options = useMemo(
      () => buildChartOptions(label, color),
      [label, color],
    );

    const data = useMemo<uPlot.AlignedData>(() => {
      if (history.length === 0) return [[Date.now() / 1000], [null]];
      const timestamps = history.map(
        (sample) => sample.sessionTimestampUs / 1_000_000,
      );
      const values = history.map((sample) => extractValue(sample, mode));
      return [timestamps, values] as uPlot.AlignedData;
    }, [history, mode]);

    return (
      <UplotChart data={data} options={options} className="w-full h-full" />
    );
  },
);

PIDHistoryChart.displayName = 'PIDHistoryChart';

export default PIDHistoryChart;
