import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OverviewTabData } from '@/types/domain/gpac/filter-stats';
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
      <Card className="bg-stat border-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Real-time Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground stat-label">
                Throughput
              </div>
              <div className="text-lg font-semibold stat text-info tabular-nums">
                {metrics.throughput}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground stat-label">
                Packet Rate
              </div>
              <div className="text-lg font-semibold stat text-info tabular-nums">
                {metrics.packetRate}
              </div>
            </div>

            <div className="space-y-1"></div>
          </div>
        </CardContent>
      </Card>
    );
  },
);

RealtimeMetricsCard.displayName = 'RealtimeMetricsCard';
