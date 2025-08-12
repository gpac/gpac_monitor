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
import { formatBytes } from '@/utils/helper';

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

const MAX_POINTS = 100;

export const BandwidthChart = memo(
  ({ currentBytes, type, refreshInterval = 5000 }: BandwidthChartProps) => {
    const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);

    const lastBytesRef = useRef<number>(0);
    const lastTimestampRef = useRef<number>(0);

    const currentBytesRef = useRef<number>(currentBytes);

    const chartTitle = useMemo(
      () => (type === 'sent' ? 'Upload Bandwidth' : 'Download Bandwidth'),
      [type],
    );
    const lineColor = useMemo(
      () => (type === 'sent' ? '#10b981' : '#3b82f6'),
      [type],
    );

    // Format bandwidth for display (stable)
    const formatBandwidth = useCallback((value: number): string => {
      return `${formatBytes(value)}/s`;
    }, []);

    const getFormattedTime = useCallback(() => {
      return new Date().toLocaleTimeString('en-US', {
        hour12: false,
        minute: '2-digit',
        second: '2-digit',
      });
    }, []);

    useEffect(() => {
      currentBytesRef.current = currentBytes;
    }, [currentBytes]);

    // Stable callback to add a sample point and update refs for the *next* calculation
    const addSamplePoint = useCallback(
      (bytesPerSecond: number, sampleTimestamp: number) => {
        const newPoint: DataPoint = {
          time: getFormattedTime(),
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
      [getFormattedTime],
    );

    useEffect(() => {
      const now = Date.now();

      lastBytesRef.current = currentBytesRef.current;
      lastTimestampRef.current = now;

      setDataPoints([
        {
          time: getFormattedTime(),
          timestamp: now,
          bytesPerSecond: 0,
        },
      ]);
    }, [getFormattedTime]);

    useEffect(() => {
      const intervalId = setInterval(() => {
        const now = Date.now();
        const lastTimestamp = lastTimestampRef.current;

        // Ensure valid timestamp and avoid division by zero or negative time
        if (now <= lastTimestamp) {
          return;
        }

        const elapsedSecs = (now - lastTimestamp) / 1000;

        // Calculate bandwidth using the *latest* bytes value from the ref
        const latestBytes = currentBytesRef.current;
        const bytesDelta = latestBytes - lastBytesRef.current;

        const bytesPerSecond = Math.max(0, bytesDelta / elapsedSecs);

        addSamplePoint(bytesPerSecond, now);
      }, refreshInterval);

      return () => clearInterval(intervalId);
    }, [refreshInterval, addSamplePoint, type]);

    // --- Chart Rendering ---
    const chartComponents = useMemo(
      () => ({
        lineProps: {
          type: 'monotone' as const,
          dataKey: 'bytesPerSecond',
          name: 'Bandwidth',
          stroke: lineColor,
          dot: false,
          activeDot: { r: 6 },
          isAnimationActive: false,
        },
        yAxisProps: {
          tickFormatter: formatBandwidth,
          width: 80,
          domain: ['auto', 'auto'],
          allowDataOverflow: true,
        },
        tooltipProps: {
          formatter: (value: number | string | Array<number | string>) => {
            // Type guard for value
            if (typeof value === 'number') {
              return [formatBandwidth(value), 'Bandwidth'];
            }
            return [value, 'Bandwidth'];
          },
          labelFormatter: (label: string) => `Time: ${label}`,
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
                  {...chartComponents.yAxisProps}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  {...chartComponents.tooltipProps}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />

                <Line {...chartComponents.lineProps} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  },
);

BandwidthChart.displayName = 'BandwidthChart';
