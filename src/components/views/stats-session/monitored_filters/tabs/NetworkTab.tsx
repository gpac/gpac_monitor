import { memo } from 'react';
import { LuUpload, LuDownload } from 'react-icons/lu';
import { NetworkTabData } from '@/types/domain/gpac/filter-stats';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { BandwidthCombinedChart } from '../charts/BandwidthCombinedChart';
import { useNetworkMetrics } from '../../hooks/data/useNetworkMetrics';

interface NetworkTabProps {
  data: NetworkTabData;
  filterName: string;
  refreshInterval?: number;
}

const DEFAULT_REFRESH_INTERVAL = 1000;

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
          {/* Stats cards side by side */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-stat border-transparent">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header: title + badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-0.5 h-5 rounded-full bg-emerald-500" />
                      <LuUpload className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Upload
                      </span>
                    </div>
                    <Badge
                      variant={
                        getActivityLevel(instantRates.bytesSentRate).variant
                      }
                      className="text-[11px] h-5 px-2"
                    >
                      {getActivityLevel(instantRates.bytesSentRate).level}
                    </Badge>
                  </div>

                  {/* Main rate - HERO */}
                  <div className="text-2xl font-bold text-emerald-500 tabular-nums leading-none">
                    {formattedStats.bytesSentRate}
                  </div>

                  {/* Secondary stats - single line */}
                  <div className="text-[11px] text-muted-foreground">
                    <span className="font-medium">
                      {formattedStats.bytesSent}
                    </span>
                    <span className="mx-1.5">·</span>
                    <span className="font-medium">
                      {formattedStats.packetsSent} packets
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-stat border-transparent">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header: title + badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-0.5 h-5 rounded-full bg-blue-500" />
                      <LuDownload className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Download
                      </span>
                    </div>
                    <Badge
                      variant={
                        getActivityLevel(instantRates.bytesReceivedRate).variant
                      }
                      className="text-[11px] h-5 px-2"
                    >
                      {getActivityLevel(instantRates.bytesReceivedRate).level}
                    </Badge>
                  </div>

                  {/* Main rate - HERO */}
                  <div className="text-2xl font-bold text-blue-500 tabular-nums leading-none">
                    {formattedStats.bytesReceivedRate}
                  </div>

                  {/* Secondary stats - single line */}
                  <div className="text-[11px] text-muted-foreground">
                    <span className="font-medium">
                      {formattedStats.bytesReceived}
                    </span>
                    <span className="mx-1.5">·</span>
                    <span className="font-medium">
                      {formattedStats.packetsReceived} packets
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Combined chart below */}
          <BandwidthCombinedChart
            bytesSent={currentStats.bytesSent}
            bytesReceived={currentStats.bytesReceived}
            refreshInterval={refreshInterval}
          />
        </div>
      </ScrollArea>
    );
  },
);

NetworkTab.displayName = 'NetworkTab';

export default NetworkTab;
