import { memo, useMemo, useCallback } from 'react';
import { LuUpload, LuDownload } from 'react-icons/lu';
import { Chart, ChartDataPoint, ChartConfig } from '@/components/common/Chart';
import { formatBytes } from '@/utils/helper';

interface BandwidthDataPoint extends ChartDataPoint {
  bandwidth: number;
  rate: number;
}

interface BandwidthChartProps {
  currentBytes: number;
  type: 'sent' | 'received';
  refreshInterval?: number;
}

export const BandwidthChart = memo(
  ({ currentBytes, type, refreshInterval = 5000 }: BandwidthChartProps) => {
    const createDataPoint = useCallback(
      (timestamp: number, time: string, currentValue: number): BandwidthDataPoint => {
        // Calculate bandwidth rate (bytes per second)
        // This is a simplified calculation - in a real scenario you'd track previous values
        const rate = Math.max(0, Math.random() * 1000000); // Mock rate for now
        
        return {
          timestamp,
          time,
          bandwidth: currentValue,
          rate,
        };
      },
      [],
    );

    const config: ChartConfig = useMemo(
      () => ({
        title: type === 'sent' ? 'Upload Bandwidth' : 'Download Bandwidth',
        icon: type === 'sent' ? <LuUpload className="h-4 w-4" /> : <LuDownload className="h-4 w-4" />,
        height: 150,
        maxPoints: 50,
        throttleInterval: refreshInterval,
        yAxisDomain: [0, 100000000], // 100MB max
        yAxisFormatter: (value: number) => formatBytes(value),
        areas: [
          {
            dataKey: 'rate',
            name: `${type === 'sent' ? 'Upload' : 'Download'} Rate`,
            stroke: type === 'sent' ? '#10b981' : '#3b82f6',
            fill: `url(#bandwidth-${type})`,
            strokeWidth: 2,
            fillOpacity: 0.3,
          },
        ],
        tooltip: {
          formatter: (value: number) => [formatBytes(value), 'Rate'],
          labelFormatter: (label: string) => `Time: ${label}`,
        },
        gradients: [
          {
            id: `bandwidth-${type}`,
            color: type === 'sent' ? '#10b981' : '#3b82f6',
            opacity: { start: 0.6, end: 0.1 },
          },
        ],
      }),
      [type, refreshInterval],
    );

    return (
      <Chart
        config={config}
        currentValue={currentBytes}
        isLive={true}
        createDataPoint={createDataPoint}
      />
    );
  },
);

BandwidthChart.displayName = 'BandwidthChart';