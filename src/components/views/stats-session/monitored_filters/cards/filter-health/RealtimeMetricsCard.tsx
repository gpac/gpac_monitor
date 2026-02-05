import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OverviewTabData } from '@/types/ui';
import {
  formatBytes,
  formatPacketRate,
  microsecondsToSeconds,
} from '@/utils/formatting';

interface RealtimeMetricsCardProps {
  filter: OverviewTabData;
}

interface CalculatedMetrics {
  throughput: string;
  packetRate: string;
  efficiency: string;
  efficiencyValue: number;
}

const calculateMetrics = (filter: OverviewTabData): CalculatedMetrics => {
  const { bytes_done, bytes_sent, pck_done, time } = filter;

  const timeInSeconds = microsecondsToSeconds(time);

  const throughput = bytes_done / timeInSeconds;
  const packetRate = pck_done / timeInSeconds;
  const efficiencyValue = bytes_sent > 0 ? (bytes_done / bytes_sent) * 100 : 0;

  return {
    throughput: `${formatBytes(throughput)}/s`,
    packetRate: formatPacketRate(packetRate),
    efficiency: `${efficiencyValue.toFixed(1)}%`,
    efficiencyValue,
  };
};

export const RealtimeMetricsCard = memo(
  ({ filter }: RealtimeMetricsCardProps) => {
    const metrics = useMemo(() => calculateMetrics(filter), [filter]);

    return (
      <Card className="bg-monitor-panel/55 border-0  border-r border-monitor-line/10">
        <CardHeader className="pb-1 pt-2 px-2">
          <CardTitle className="text-xs font-medium">Real-time</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="space-y-1">
            <div className="flex justify-between items-baseline">
              <div className="text-xs text-muted-foreground">Throughput</div>
              <div className="text-sm font-semibold text-info tabular-nums">
                {metrics.throughput}
              </div>
            </div>

            <div className="flex justify-between items-baseline">
              <div className="text-xs text-muted-foreground">Packet Rate</div>
              <div className="text-sm font-semibold text-info tabular-nums">
                {metrics.packetRate}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  },
);

RealtimeMetricsCard.displayName = 'RealtimeMetricsCard';
