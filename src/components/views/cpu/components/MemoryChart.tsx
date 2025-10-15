import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBytes } from '@/utils/helper';
import { memo, useMemo } from 'react';

import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';

interface MemoryChartProps {
  currentMemoryPercent: number;
  currentMemoryProcess?: number;
  isLive: boolean;
  isLoading?: boolean;
}

export const MemoryChart = memo(
  ({
    currentMemoryProcess = 0,
    currentMemoryPercent,
    isLoading,
  }: MemoryChartProps) => {
    // Determine gauge color based on percent thresholds
    const fillColor = useMemo(() => {
      if (currentMemoryPercent < 50) return '#34d399'; // green
      if (currentMemoryPercent < 80) return '#fbbf24'; // yellow
      return '#f87171'; // red
    }, [currentMemoryPercent]);

    // Prepare gauge data
    const gaugeData = useMemo(
      () => [{ name: 'Memory', value: currentMemoryPercent }],
      [currentMemoryPercent],
    );

    return (
      <Card className="bg-stat border-0">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm stat-label">
            Memory Usage Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="relative h-40 w-40">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="70%"
                  outerRadius="100%"
                  data={gaugeData}
                  startAngle={180}
                  endAngle={0}
                >
                  <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    angleAxisId={0}
                    tick={false}
                  />
                  <RadialBar
                    background
                    dataKey="value"
                    cornerRadius={8}
                    fill={fillColor}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <span className="text-2xl font-bold text-info tabular-nums">
                  {isLoading ? '...' : `${currentMemoryPercent.toFixed(1)}%`}
                </span>
                <span className="text-sm font-medium text-info tabular-nums">
                  {isLoading ? '...' : formatBytes(currentMemoryProcess)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  },
);
