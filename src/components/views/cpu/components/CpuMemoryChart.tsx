import { memo, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useOptimizedResize } from '@/shared/hooks/useOptimizedResize';
import { useChartData } from '../hooks/useChartData';

export interface CpuMemoryDataPoint {
  timestamp: number;
  time: string;
  cpu_percent: number;
  memory_mb: number;
}

interface CpuMemoryChartProps {
  currentCPUPercent: number;
  currentMemoryBytes: number;
  isLive: boolean;
  maxPoints?: number;
  windowDuration?: number;
}

export const CpuMemoryChart = memo(
  ({
    currentCPUPercent,
    currentMemoryBytes,
    isLive,
    maxPoints = 400,
    windowDuration,
  }: CpuMemoryChartProps) => {
    const [isResizing, setIsResizing] = useState(false);

    const currentMemoryMB = useMemo(
      () => currentMemoryBytes / (1024 * 1024),
      [currentMemoryBytes],
    );

    // Calculate smart Y-axis max for memory (left axis)
    const memoryYAxisMax = useMemo(() => {
      const minScale = 100;
      const roundTo = 50;
      const calculated = Math.ceil((currentMemoryMB * 1.5) / roundTo) * roundTo;
      return Math.max(minScale, calculated);
    }, [currentMemoryMB]);

    // Generate Y-axis ticks for memory
    const memoryYAxisTicks = useMemo(() => {
      return [
        0,
        memoryYAxisMax * 0.25,
        memoryYAxisMax * 0.5,
        memoryYAxisMax * 0.75,
        memoryYAxisMax,
      ];
    }, [memoryYAxisMax]);

    const { ref } = useOptimizedResize({
      onResizeStart: () => setIsResizing(true),
      onResizeEnd: () => setIsResizing(false),
      debounce: 32,
      throttle: true,
      useTransform: true,
    }) as { ref: React.RefObject<HTMLElement> };

    const chartRef = ref as React.RefObject<HTMLDivElement>;

    const { dataPoints } = useChartData(
      currentCPUPercent,
      currentMemoryMB,
      isLive,
      maxPoints,
      windowDuration,
      150,
    );

    const tooltipProps = useMemo(
      () => ({
        formatter: (value: number, name: string) => {
          if (name === 'Memory (MB)') {
            return [`${value.toFixed(2)} MB`, name];
          }
          return [`${value.toFixed(2)}%`, name];
        },
        labelFormatter: (label: string) => `Time: ${label}`,
        contentStyle: {
          backgroundColor: 'rgb(2 6 23)',
          color: 'rgb(226 232 240)',
          border: '1px solid hsl(var(--border))',
          borderRadius: '6px',
          fontVariantNumeric: 'tabular-nums',
        },
      }),
      [],
    );

    return (
      <Card ref={chartRef} className="bg-stat border-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="flex  justify-center items-center gap-2 text-sm stat stat-label">
            Memory / CPU
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            style={{ width: '100%', height: 250 }}
            className={`gpu-optimized ${isResizing ? 'contain-layout contain-style is-interacting' : ''}`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dataPoints}
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient
                    id="memoryGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.16} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05} />
                  </linearGradient>
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
                {/* Left Y-axis for Memory */}
                <YAxis
                  yAxisId="left"
                  domain={[0, memoryYAxisMax]}
                  ticks={memoryYAxisTicks}
                  tickFormatter={(value: number) => `${value.toFixed(0)}`}
                  tick={{ fontSize: 11, fill: '#38bdf8' }}
                  tickLine={{ stroke: '#38bdf8', opacity: 0.5 }}
                  axisLine={{ stroke: '#38bdf8' }}
                  width={50}
                />
                {/* Right Y-axis for CPU */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(value: number) => `${value}%`}
                  tick={{ fontSize: 11, fill: '#ef4444' }}
                  tickLine={{ stroke: '#ef4444', opacity: 0.5 }}
                  axisLine={{ stroke: '#ef4444' }}
                  width={50}
                />
                <Tooltip
                  formatter={tooltipProps.formatter}
                  labelFormatter={tooltipProps.labelFormatter}
                  contentStyle={tooltipProps.contentStyle}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: '12px',
                    paddingTop: '20px',
                    display: 'flex',
                    justifyContent: 'space-around',
                  }}
                  iconType="line"
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="memory_mb"
                  name="Memory (MB)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fill="url(#memoryGradient)"
                  fillOpacity={0.4}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="cpu_percent"
                  name="CPU (%)"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#cpuGradient)"
                  fillOpacity={0.4}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  },
);

CpuMemoryChart.displayName = 'CpuMemoryChart';
