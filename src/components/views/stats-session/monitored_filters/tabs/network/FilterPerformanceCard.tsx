import { memo, useMemo, useState } from 'react';
import { LuArrowUpDown } from 'react-icons/lu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type uPlot from 'uplot';
import { SeriesLegend } from '@/components/common/charts';
import { useFilterPerformanceChartData } from '../../charts/hooks/useFilterPerformanceChartData';
import {
  BANDWIDTH_SERIES,
  formatBw,
} from '../../charts/config/bandwidthCombinedUplotConfig';
import { formatMicroseconds, formatChartTimeFromUs } from '@/utils/formatting';
import { useAdaptiveChartHeight } from '@/shared/hooks';
import LineHistoryChart from '../../charts/LineHistoryChart';

type SeriesKey = 'outband' | 'inband' | 'lastTaskTime';

const SERIES_ORDER: SeriesKey[] = ['outband', 'inband', 'lastTaskTime'];

const SERIES_META: Record<SeriesKey, { label: string; color: string }> = {
  outband: { label: 'Outband', color: '#10b981' },
  inband: { label: 'Inband', color: '#3b82f6' },
  lastTaskTime: { label: 'Filter Proc. Time', color: '#f59e0b' },
};

interface FilterPerformanceCardProps {
  filterId: string;
  showCurrentTime?: boolean;
}

export const FilterPerformanceCard = memo(
  ({ filterId, showCurrentTime = false }: FilterPerformanceCardProps) => {
    const chartHeight = useAdaptiveChartHeight();

    const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({
      outband: true,
      inband: true,
      lastTaskTime: true,
    });

    const { outbandPoints, inbandPoints, lastTaskTimePoints } =
      useFilterPerformanceChartData({ filterId });

    const { data, timeLabels } = useMemo(() => {
      const maxLength = Math.max(outbandPoints.length, inbandPoints.length);
      const indices = Array.from(
        { length: maxLength },
        (_unused, index) => index,
      );

      const labels = indices.map((index) => {
        const ts =
          outbandPoints[index]?.timestamp ?? inbandPoints[index]?.timestamp;
        return ts ? formatChartTimeFromUs(ts) : '';
      });

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
          <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <LuArrowUpDown className="h-4 w-4 opacity-60 shrink-0" />
            <SeriesLegend
              items={SERIES_ORDER.map((key) => ({
                key,
                label: SERIES_META[key].label,
                color: SERIES_META[key].color,
                active: visible[key],
                onToggle: () =>
                  setVisible((prev) => ({ ...prev, [key]: !prev[key] })),
              }))}
            />
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
            height={chartHeight}
          />
        </CardContent>
      </Card>
    );
  },
);

FilterPerformanceCard.displayName = 'FilterPerformanceCard';
