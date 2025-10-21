import { memo } from 'react';
import { LuUpload, LuDownload } from 'react-icons/lu';
import { NetworkTabData } from '@/types/domain/gpac/filter-stats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { BandwidthChart } from '../charts/BandwidthChart';
import { useNetworkMetrics } from '../../hooks/data/useNetworkMetrics';

interface NetworkTabProps {
  data: NetworkTabData;
  filterName: string;
  refreshInterval?: number;
}

const DEFAULT_REFRESH_INTERVAL = 1000; // 1 seconde pour le monitoring temps réel

const NetworkTab = memo(
  ({
    data,
    filterName,
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
  }: NetworkTabProps) => {
    const { currentStats, instantRates, formattedStats, getActivityLevel } =
      useNetworkMetrics(data, filterName);

    return (
      <ScrollArea className="h-[400px]">
        <div className="space-y-4">
          {/* Real-time throughput overview */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-stat border-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <LuUpload className="h-4 w-4 stat-label" />
                    Upload Rate
                  </div>
                  <Badge
                    variant={
                      getActivityLevel(instantRates.bytesSentRate).variant
                    }
                  >
                    {getActivityLevel(instantRates.bytesSentRate).level}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="text-2xl font-bold stat text-info tabular-nums">
                    {formattedStats.bytesSentRate}
                  </div>
                  <div className="text-xs text-muted-foreground  stat-label">
                    Data Rate
                  </div>
                </div>

                <div className="pt-2 border-t border-border/50">
                  <div className="grid grid-cols-2 gap-y-1 text-xs">
                    <div className="text-muted-foreground stat-label">
                      Total
                    </div>
                    <div className="font-medium stat text-info tabular-nums">
                      {formattedStats.bytesSent}
                    </div>
                    <div className="text-muted-foreground stat-label">
                      Packets
                    </div>
                    <div className="font-medium stat text-info tabular-nums">
                      {formattedStats.packetsSent}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-stat border-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <LuDownload className="h-4 w-4 stat-label" />
                    Download Rate
                  </div>
                  <Badge
                    variant={
                      getActivityLevel(instantRates.bytesReceivedRate).variant
                    }
                  >
                    {getActivityLevel(instantRates.bytesReceivedRate).level}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="text-2xl font-bold stat text-info tabular-nums">
                    {formattedStats.bytesReceivedRate}
                  </div>
                  <div className="text-xs text-muted-foreground stat-label">
                    Data Rate
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-lg font-semibold stat text-info tabular-nums">
                    {formattedStats.packetsReceivedRate}
                  </div>
                  <div className="text-xs text-muted-foreground stat-label">
                    Packet Rate
                  </div>
                </div>

                <div className="pt-2 border-t border-border/50">
                  <div className="grid grid-cols-2 gap-y-1 text-xs">
                    <div className="text-muted-foreground stat-label">
                      Total
                    </div>
                    <div className="font-medium stat text-info tabular-nums">
                      {formattedStats.bytesReceived}
                    </div>
                    <div className="text-muted-foreground stat-label">
                      Packets
                    </div>
                    <div className="font-medium stat text-info tabular-nums">
                      {formattedStats.packetsReceived}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <BandwidthChart
              currentBytes={currentStats.bytesSent}
              type="sent"
              refreshInterval={refreshInterval}
            />

            <BandwidthChart
              currentBytes={currentStats.bytesReceived}
              type="received"
              refreshInterval={refreshInterval}
            />
          </div>
        </div>
      </ScrollArea>
    );
  },
);

NetworkTab.displayName = 'NetworkTab';

export default NetworkTab;
