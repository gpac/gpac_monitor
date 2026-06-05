import { memo, useMemo, useState } from 'react';
import { LuArrowUpDown } from 'react-icons/lu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type uPlot from 'uplot';
import { useFilterPerformanceChartData } from './hooks/useFilterPerformanceChartData';
import {
  BANDWIDTH_SERIES,
  formatBw,
} from './config/bandwidthCombinedUplotConfig';
import { formatMicroseconds } from '@/utils/formatting';
import LineHistoryChart from './LineHistoryChart';

type SeriesKey = 'outband' | 'inband' | 'lastTaskTime';

const SERIES_ORDER: SeriesKey[] = ['outband', 'inband', 'lastTaskTime'];

const SERIES_META: Record<SeriesKey, { label: string; color: string }> = {
  outband: { label: 'Outband', color: '#10b981' },
  inband: { label: 'Inband', color: '#3b82f6' },
  lastTaskTime: { label: 'Filter Proc. Time', color: '#f59e0b' },
};

interface BandwidthCombinedChartProps {
  filterId: string;
  bytesSent: number;
  bytesReceived: number;
  lastTaskTimeUs?: number;
  windowDurationMs?: number;
  showCurrentTime?: boolean;
}

export const BandwidthCombinedChart = memo(
  ({
    filterId,
    bytesSent,
    bytesReceived,
    lastTaskTimeUs = 0,
    windowDurationMs,
    showCurrentTime = false,
  }: BandwidthCombinedChartProps) => {
    const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({
      outband: true,
      inband: true,
      lastTaskTime: true,
    });

    const { outbandPoints, inbandPoints, lastTaskTimePoints } =
      useFilterPerformanceChartData({
        filterId,
        bytesSent,
        bytesReceived,
        lastTaskTimeUs,
        windowDurationMs,
      });

    const { data, timeLabels } = useMemo(() => {
      const maxLength = Math.max(outbandPoints.length, inbandPoints.length);
      const indices = Array.from(
        { length: maxLength },
        (_unused, index) => index,
      );

      const labels = indices.map(
        (index) =>
          outbandPoints[index]?.time || inbandPoints[index]?.time || '',
      );

      const pointsMap: Record<SeriesKey, (number | null)[]> = {
        outband: indices.map((index) => outbandPoints[index]?.value ?? 0),
        inband: indices.map((index) => inbandPoints[index]?.value ?? 0),
        lastTaskTime: indices.map(
          (index) => lastTaskTimePoints[index]?.value ?? 0,
        ),
      };

      const visibleKeys = SERIES_ORDER.filter((key) => visible[key]);
      const filteredData: uPlot.AlignedData = [
        indices,
        ...visibleKeys.map((key) => pointsMap[key]),
      ];

      return { data: filteredData, timeLabels: labels };
    }, [outbandPoints, inbandPoints, lastTaskTimePoints, visible]);

    const filteredSeries = useMemo(
      () =>
        SERIES_ORDER.flatMap((key, idx) =>
          visible[key] ? [BANDWIDTH_SERIES[idx]] : [],
        ),
      [visible],
    );

    return (
      <Card className="bg-monitor-panel border-transparent">
        <CardHeader className="pb-1">
          <CardTitle className="flex justify-center items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <LuArrowUpDown className="h-4 w-4 opacity-60" />
            <ToggleGroup
              type="multiple"
              value={SERIES_ORDER.filter((key) => visible[key]) as string[]}
              onValueChange={(values) =>
                setVisible({
                  outband: values.includes('outband'),
                  inband: values.includes('inband'),
                  lastTaskTime: values.includes('lastTaskTime'),
                })
              }
              className="flex items-center gap-2 p-0 bg-transparent border-0"
            >
              {SERIES_ORDER.map((key) => (
                <ToggleGroupItem
                  key={key}
                  value={key}
                  className="flex items-center gap-1.5 h-auto px-0 py-0 bg-transparent border-0 shadow-none opacity-40 data-[state=on]:opacity-100 normal-case"
                >
                  <span
                    className="w-3 h-0.5 rounded-full"
                    style={{ background: SERIES_META[key].color }}
                  />
                  <span style={{ color: SERIES_META[key].color }}>
                    {SERIES_META[key].label}
                  </span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {showCurrentTime && timeLabels.length > 0 && (
              <span className="ml-auto font-mono normal-case opacity-60 text-xs">
                {timeLabels[timeLabels.length - 1]}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <LineHistoryChart
            series={filteredSeries}
            data={data}
            timeLabels={timeLabels}
            leftAxisFormat={formatBw}
            rightAxisFormat={formatMicroseconds}
            showCurrentTime={false}
            showEndLabels={false}
            height={230}
          />
        </CardContent>
      </Card>
    );
  },
);

BandwidthCombinedChart.displayName = 'BandwidthCombinedChart';
