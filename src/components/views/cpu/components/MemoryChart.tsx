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
}

export const MemoryChart = memo(
  ({ currentMemoryProcess = 0, currentMemoryPercent }: MemoryChartProps) => {
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
          <div className="flex items-center gap-6">
            {/* Gauge */}
            <div className="relative h-28 w-28">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="75%"
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
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold">
                  {currentMemoryPercent.toFixed(2)}%
                </span>
                <span className="text-xs text-gray-300">
                  {formatBytes(currentMemoryProcess)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  },
);
