import { memo, useMemo } from 'react';
import { LuUpload, LuDownload } from 'react-icons/lu';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBandwidthChart } from './hooks/useBandwidthChart';
import {
  DEFAULT_REFRESH_INTERVAL,
  BANDWIDTH_COLORS,
  CHART_TITLES,
  CHART_HEIGHT,
  CHART_MARGIN,
  Y_AXIS_CONFIG,
  TOOLTIP_STYLE,
  X_AXIS_TICK,
  Y_AXIS_TICK,
} from './config/bandwidthChartConfig';

interface BandwidthChartProps {
  currentBytes: number;
  type: 'sent' | 'received';
  refreshInterval?: number;
}

export const BandwidthChart = memo(
  ({
    currentBytes,
    type,
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
  }: BandwidthChartProps) => {
    const { dataPoints, formatBandwidth, tooltipFormatter } = useBandwidthChart(
      {
        currentBytes,
        refreshInterval,
      },
    );

    const chartTitle = useMemo(() => CHART_TITLES[type], [type]);
    const lineColor = useMemo(() => BANDWIDTH_COLORS[type], [type]);

    // Chart configuration (stable reference)
    const chartConfig = useMemo(
      () => ({
        lineProps: {
          type: 'monotone' as const,
          dataKey: 'bytesPerSecond',
          name: 'Bandwidth',
          stroke: lineColor,
          dot: false,
          activeDot: { r: 6 },
          isAnimationActive: false,
          strokeWidth: 2,
        },
        yAxisProps: {
          tickFormatter: formatBandwidth,
          ...Y_AXIS_CONFIG,
        },
      }),
      [lineColor, formatBandwidth],
    );

    return (
      <Card className="bg-stat border-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm stat stat-label">
            {type === 'sent' ? (
              <LuUpload className="h-4 w-4" />
            ) : (
              <LuDownload className="h-4 w-4" />
            )}
            {chartTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: CHART_HEIGHT }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataPoints} margin={CHART_MARGIN}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="time"
                  tick={X_AXIS_TICK}
                  minTickGap={40}
                  tickMargin={5}
                />
                <YAxis {...chartConfig.yAxisProps} tick={Y_AXIS_TICK} />
                <Tooltip
                  formatter={tooltipFormatter}
                  labelFormatter={(label: string) => `Time: ${label}`}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Line {...chartConfig.lineProps} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  },
);

BandwidthChart.displayName = 'BandwidthChart';
