import { memo, useMemo, useRef, useState } from 'react';
import uPlot from 'uplot';
import { UplotChart } from '@/components/common/UplotChart';
import {
  createLineChartConfig,
  useContainerSize,
  type SeriesDef,
  type EndLabelInfo,
} from '@/components/common/charts';

export const CHART_HEIGHT = 140;

interface LineHistoryChartProps {
  series: SeriesDef[];
  data: uPlot.AlignedData;
  timeLabels: string[];
  leftAxisFormat?: (value: number) => string;
  showCurrentTime?: boolean;
  showEndLabels?: boolean;
  height?: number;
}

/** Index-based multi-series time chart with end-value labels (uPlot common layer). */
const LineHistoryChart = memo(
  ({
    series,
    data,
    timeLabels,
    leftAxisFormat,
    showCurrentTime = true,
    showEndLabels = true,
    height = CHART_HEIGHT,
  }: LineHistoryChartProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const dimensions = useContainerSize(containerRef);
    const timeLabelsRef = useRef<string[]>([]);
    timeLabelsRef.current = timeLabels;
    const [endLabels, setEndLabels] = useState<EndLabelInfo[]>([]);

    const options = useMemo(
      () =>
        createLineChartConfig({
          series,
          timeLabelsRef,
          leftAxis: leftAxisFormat ? { formatY: leftAxisFormat } : undefined,
          onEndLabels: showEndLabels ? setEndLabels : undefined,
          ...dimensions,
        }),
      [series, dimensions, leftAxisFormat, showEndLabels],
    );

    return (
      <div
        style={{ width: '100%' }}
        className="flex flex-col justify-items-end"
      >
        {showCurrentTime && timeLabels.length > 0 && (
          <div className="w-full text-right font-mono text-xs opacity-60 mb-1">
            {timeLabels[timeLabels.length - 1]}
          </div>
        )}
        <div
          ref={containerRef}
          style={{ width: '100%', height, position: 'relative' }}
        >
          <UplotChart
            data={data}
            options={options}
            className="w-12/12 h-full"
          />
          {endLabels.map((endLabel, index) => {
            const clampedTop = Math.min(Math.max(endLabel.top, 0), height - 16);
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
                className="bg-monitor-panel text-[10px] font-mono leading-none text-info px-1 py-0.5 rounded"
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

LineHistoryChart.displayName = 'LineHistoryChart';

export default LineHistoryChart;
