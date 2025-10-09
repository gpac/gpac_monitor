import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { formatBytes, formatChartTime } from '@/utils/helper';

interface DataPoint {
  time: string;
  timestamp: number;
  bytesPerSecond: number;
}

interface BandwidthChartProps {
  currentBytes: number;
  type: 'sent' | 'received';
  refreshInterval?: number;
}

const MAX_POINTS = 300; // 5 minutes d'historique à 1s/point
const DEFAULT_REFRESH_INTERVAL = 1000; // 1 seconde

export const BandwidthChart = memo(
  ({
    currentBytes,
    type,
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
  }: BandwidthChartProps) => {
    const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);

    const lastBytesRef = useRef<number>(currentBytes);
    const lastTimestampRef = useRef<number>(Date.now());
    const currentBytesRef = useRef<number>(currentBytes);
    const isInitializedRef = useRef<boolean>(false);

    const chartTitle = useMemo(
      () => (type === 'sent' ? 'Upload Bandwidth' : 'Download Bandwidth'),
      [type],
    );

    const lineColor = useMemo(
      () => (type === 'sent' ? '#10b981' : '#3b82f6'),
      [type],
    );

    // Format bandwidth for display
    const formatBandwidth = useCallback((value: number): string => {
      return `${formatBytes(value)}/s`;
    }, []);

    // Update current bytes ref
    useEffect(() => {
      currentBytesRef.current = currentBytes;
    }, [currentBytes]);

    // Add sample point to chart
    const addSamplePoint = useCallback(
      (bytesPerSecond: number, sampleTimestamp: number) => {
        const newPoint: DataPoint = {
          time: formatChartTime(),
          timestamp: sampleTimestamp,
          bytesPerSecond,
        };

        setDataPoints((prev) => {
          const newPoints = [...prev, newPoint];
          return newPoints.length > MAX_POINTS
            ? newPoints.slice(-MAX_POINTS)
            : newPoints;
        });

        lastBytesRef.current = currentBytesRef.current;
        lastTimestampRef.current = sampleTimestamp;
      },
      [],
    );

    // Initialize chart data ONCE on mount
    useEffect(() => {
      if (isInitializedRef.current) return;

      const now = Date.now();
      lastBytesRef.current = currentBytes;
      lastTimestampRef.current = now;
      isInitializedRef.current = true;

      // Add initial point immediately
      setDataPoints([
        {
          time: formatChartTime(),
          timestamp: now,
          bytesPerSecond: 0,
        },
      ]);
    }, [currentBytes]);

    // Update bandwidth data at refresh interval
    useEffect(() => {
      if (!isInitializedRef.current) return;

      const intervalId = setInterval(() => {
        const now = Date.now();
        const lastTimestamp = lastTimestampRef.current;

        if (now <= lastTimestamp) return;

        const elapsedSecs = (now - lastTimestamp) / 1000;
        const latestBytes = currentBytesRef.current;
        const bytesDelta = latestBytes - lastBytesRef.current;
        const bytesPerSecond = Math.max(0, bytesDelta / elapsedSecs);

        addSamplePoint(bytesPerSecond, now);
      }, refreshInterval);

      return () => clearInterval(intervalId);
    }, [refreshInterval, addSamplePoint]);

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
          width: 80,
          domain: ['auto', 'auto'],
          allowDataOverflow: true,
        },
      }),
      [lineColor, formatBandwidth],
    );

    // Tooltip formatter (stable reference)
    const tooltipFormatter = useCallback(
      (value: number | string | Array<number | string>) => {
        if (typeof value === 'number') {
          return [formatBandwidth(value), 'Bandwidth'];
        }
        return [value, 'Bandwidth'];
      },
      [formatBandwidth],
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
          <div style={{ width: '100%', height: 150 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dataPoints}
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  minTickGap={40}
                  tickMargin={5}
                />
                <YAxis
                  {...chartConfig.yAxisProps}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  formatter={tooltipFormatter}
                  labelFormatter={(label: string) => `Time: ${label}`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
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
