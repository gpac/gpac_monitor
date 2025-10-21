import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOptimizedResize } from '@/shared/hooks/useOptimizedResize';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export interface ChartDataPoint {
  timestamp: number;
  time: string;
  [key: string]: any;
}

export interface ChartAreaConfig {
  dataKey: string;
  name: string;
  stroke: string;
  fill: string;
  fillOpacity?: number;
  strokeWidth?: number;
}

export interface ChartTooltipConfig {
  formatter: (value: number) => [string, string];
  labelFormatter: (label: string) => string;
  contentStyle?: React.CSSProperties;
}

export interface ChartConfig {
  title: string;
  icon: React.ReactNode;
  height?: number;
  maxPoints?: number;
  windowDuration?: number; // Time window in milliseconds (e.g., 20000 for 20s)
  throttleInterval?: number;
  yAxisDomain?: [number | string, number | string];
  yAxisTicks?: number[];
  yAxisFormatter?: (value: number) => string;
  areas: ChartAreaConfig[];
  tooltip: ChartTooltipConfig;
  gradients?: Array<{
    id: string;
    color: string;
    opacity?: { start: number; end: number };
  }>;
}

interface ChartProps<T extends ChartDataPoint> {
  config: ChartConfig;
  currentValue: number;
  isLive: boolean;
  createDataPoint: (timestamp: number, time: string, currentValue: number) => T;
}

const DEFAULT_CONFIG = {
  height: 200,
  maxPoints: 400,
  throttleInterval: 50,
  yAxisDomain: [0, 100] as [number, number],
  yAxisFormatter: (value: number) => `${value}%`,
};

export const Chart = memo(
  <T extends ChartDataPoint>({
    config,
    currentValue,
    isLive,
    createDataPoint,
  }: ChartProps<T>) => {
    const [dataPoints, setDataPoints] = useState<T[]>([]);
    const [isResizing, setIsResizing] = useState(false);
    const lastRecordedValueRef = useRef<number>(0);
    const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Optimize chart during resize with GPU transforms
    const { ref } = useOptimizedResize({
      onResizeStart: () => setIsResizing(true),
      onResizeEnd: () => setIsResizing(false),
      debounce: 32,
      throttle: true,
      useTransform: true, // GPU transforms pendant resize
    }) as { ref: React.RefObject<HTMLElement> };

    const chartRef = ref as React.RefObject<HTMLDivElement>;

    const mergedConfig = useMemo(
      () => ({
        ...DEFAULT_CONFIG,
        ...config,
      }),
      [config],
    );

    const updateDataPoints = useCallback(() => {
      if (!isLive || currentValue === lastRecordedValueRef.current) return;
      lastRecordedValueRef.current = currentValue;
      const now = Date.now();

      setDataPoints((prevPoints) => {
        // Filter by time window if specified, otherwise use maxPoints
        let filteredPoints = prevPoints;

        if (
          mergedConfig.windowDuration &&
          mergedConfig.windowDuration !== Infinity
        ) {
          const cutoff = now - mergedConfig.windowDuration;
          filteredPoints = prevPoints.filter((p) => p.timestamp >= cutoff);
        } else if (prevPoints.length >= mergedConfig.maxPoints) {
          // Fallback to maxPoints if no windowDuration
          filteredPoints = prevPoints.slice(
            prevPoints.length - mergedConfig.maxPoints + 1,
          );
        }

        // Calculate relative time from oldest point
        const oldestTimestamp =
          filteredPoints.length > 0 ? filteredPoints[0].timestamp : now;
        const relativeSeconds = ((now - oldestTimestamp) / 1000).toFixed(1);
        const time = `${relativeSeconds}s`;

        const newPoint = createDataPoint(now, time, currentValue);
        const newPoints = [...filteredPoints, newPoint];

        // Recalculate all relative times for consistency
        const oldest = newPoints[0].timestamp;
        return newPoints.map((point) => ({
          ...point,
          time: `${((point.timestamp - oldest) / 1000).toFixed(1)}s`,
        }));
      });
    }, [
      currentValue,
      isLive,
      createDataPoint,
      mergedConfig.maxPoints,
      mergedConfig.windowDuration,
    ]);

    useEffect(() => {
      setDataPoints((prev) => {
        if (prev.length === 0) return prev;

        const now = Date.now();
        let filtered = prev;

        // Filter by windowDuration if specified
        if (
          mergedConfig.windowDuration &&
          mergedConfig.windowDuration !== Infinity
        ) {
          const cutoff = now - mergedConfig.windowDuration;
          filtered = prev.filter((p) => p.timestamp >= cutoff);
        } else if (prev.length > mergedConfig.maxPoints) {
          // Fallback to maxPoints
          filtered = prev.slice(prev.length - mergedConfig.maxPoints);
        }

        if (filtered.length === 0) return prev;

        // Recalculate relative times
        const oldest = filtered[0].timestamp;
        return filtered.map((point) => ({
          ...point,
          time: `${((point.timestamp - oldest) / 1000).toFixed(1)}s`,
        }));
      });
    }, [mergedConfig.maxPoints, mergedConfig.windowDuration]);

    useEffect(() => {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }

      throttleTimerRef.current = setTimeout(() => {
        updateDataPoints();
        throttleTimerRef.current = null;
      }, mergedConfig.throttleInterval);

      return () => {
        if (throttleTimerRef.current) {
          clearTimeout(throttleTimerRef.current);
        }
      };
    }, [currentValue, updateDataPoints, mergedConfig.throttleInterval]);

    const tooltipProps = useMemo(
      () => ({
        formatter: mergedConfig.tooltip.formatter,
        labelFormatter: mergedConfig.tooltip.labelFormatter,
        contentStyle: mergedConfig.tooltip.contentStyle || {
          backgroundColor: 'rgb(2 6 23 )',
          color: 'rgb(226 232 240)',
          border: '1px solid hsl(var(--border))',
          borderRadius: '6px',
          fontVariantNumeric: 'tabular-nums',
        },
      }),
      [mergedConfig.tooltip],
    );

    return (
      <Card ref={chartRef} className="bg-stat border-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm stat stat-label">
            {mergedConfig.icon}
            {mergedConfig.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            style={{ width: '100%', height: mergedConfig.height }}
            className={`gpu-optimized ${isResizing ? 'contain-layout contain-style is-interacting' : ''}`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                key={mergedConfig.maxPoints}
                data={dataPoints}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  {mergedConfig.gradients?.map((gradient) => (
                    <linearGradient
                      key={gradient.id}
                      id={gradient.id}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={gradient.color}
                        stopOpacity={gradient.opacity?.start || 0.6}
                      />
                      <stop
                        offset="95%"
                        stopColor={gradient.color}
                        stopOpacity={gradient.opacity?.end || 0.1}
                      />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: '#6ee7b7' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  minTickGap={40}
                />
                <YAxis
                  domain={mergedConfig.yAxisDomain}
                  ticks={mergedConfig.yAxisTicks}
                  tickFormatter={mergedConfig.yAxisFormatter}
                  tick={{ fontSize: 11, fill: '#6ee7b7' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  width={45}
                />
                <Tooltip
                  formatter={tooltipProps.formatter}
                  labelFormatter={tooltipProps.labelFormatter}
                  contentStyle={tooltipProps.contentStyle}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} iconType="line" />
                {mergedConfig.areas.map((areaConfig, index) => (
                  <Area
                    key={index}
                    type="monotone"
                    dataKey={areaConfig.dataKey}
                    name={areaConfig.name}
                    stroke={areaConfig.stroke}
                    strokeWidth={areaConfig.strokeWidth || 2}
                    fill={areaConfig.fill}
                    fillOpacity={areaConfig.fillOpacity || 0.4}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  },
);

Chart.displayName = 'Chart';
