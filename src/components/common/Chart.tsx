import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  throttleInterval?: number;
  yAxisDomain?: [number, number];
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
    const lastRecordedValueRef = useRef<number>(0);
    const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      const time = new Date(now).toLocaleTimeString('en-US', {
        hour12: false,
        minute: '2-digit',
        second: '2-digit',
      });

      const newPoint = createDataPoint(now, time, currentValue);

      setDataPoints((prevPoints) => {
        const newPoints = [...prevPoints, newPoint];
        if (newPoints.length > mergedConfig.maxPoints) {
          return newPoints.slice(newPoints.length - mergedConfig.maxPoints);
        }
        return newPoints;
      });
    }, [currentValue, isLive, createDataPoint, mergedConfig.maxPoints]);

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
          backgroundColor: 'hsl(var(--background))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '6px',
        },
      }),
      [mergedConfig.tooltip],
    );

    return (
      <Card className="bg-stat border-0">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm stat stat-label">
            {mergedConfig.icon}
            {mergedConfig.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: mergedConfig.height }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
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
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  minTickGap={40}
                />
                <YAxis
                  domain={mergedConfig.yAxisDomain}
                  tickFormatter={mergedConfig.yAxisFormatter}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
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
