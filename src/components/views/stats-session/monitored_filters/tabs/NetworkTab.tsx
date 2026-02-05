import { memo, useMemo } from 'react';
import { LuUpload, LuDownload } from 'react-icons/lu';
import { NetworkTabData } from '@/types/ui';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BandwidthCombinedChart } from '../charts/BandwidthCombinedChart';
import { useNetworkMetrics } from '../../hooks/data/useNetworkMetrics';
import { TAB_STYLES } from './styles';

interface NetworkTabProps {
  filterId: string;
  data: NetworkTabData;
  filterName: string;
  refreshInterval?: number;
}

const DEFAULT_REFRESH_INTERVAL = 1000;

const NetworkTab = memo(
  ({
    filterId,
    data,
    filterName,
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
  }: NetworkTabProps) => {
    const { currentStats, instantRates, formattedStats, getActivityLevel } =
      useNetworkMetrics(data, filterName);

    const uploadActivity = useMemo(
      () => getActivityLevel(instantRates.bytesSentRate),
      [instantRates.bytesSentRate, getActivityLevel],
    );

    const downloadActivity = useMemo(
      () => getActivityLevel(instantRates.bytesReceivedRate),
      [instantRates.bytesReceivedRate, getActivityLevel],
    );

    return (
      <div className={TAB_STYLES.TAB_CONTAINER}>
        {/* ROW 1: Compact Status Bar */}
        <div className={TAB_STYLES.STATUS_BAR}>
          <span className="font-medium text-info">Network Activity</span>
          <span className={TAB_STYLES.STATUS_SEPARATOR}>·</span>
          <span className={TAB_STYLES.STATUS_LABEL}>Filter: {filterName}</span>
          <span className="ml-auto text-muted-foreground/70 text-xs">
            Live <span className="text-error ">⏺</span>
          </span>
        </div>

        {/* ROW 2: Stats cards - 2 columns */}
        <div className={TAB_STYLES.GRID_2_COL}>
          <Card className="bg-monitor-panel border-transparent">
            <CardContent className="p-2">
              <div className="space-y-2">
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
                    variant={downloadActivity.variant}
                    className="text-[11px] h-5 px-2"
                  >
                    {downloadActivity.level}
                  </Badge>
                </div>

                {/* Main rate - HERO */}
                <div className="text-xl font-bold text-monitor-download tabular-nums leading-none">
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
          <Card className="bg-monitor-panel border-transparent">
            <CardContent className="p-2">
              <div className="space-y-2">
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
                    variant={uploadActivity.variant}
                    className="text-[11px] h-5 px-2"
                  >
                    {uploadActivity.level}
                  </Badge>
                </div>

                {/* Main rate - HERO */}
                <div className="text-xl font-bold text-emerald-500 tabular-nums leading-none">
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
        </div>

        {/* ROW 3: Combined chart */}
        <BandwidthCombinedChart
          filterId={filterId}
          bytesSent={currentStats.bytesSent}
          bytesReceived={currentStats.bytesReceived}
          refreshInterval={refreshInterval}
        />
      </div>
    );
  },
);

NetworkTab.displayName = 'NetworkTab';

export default NetworkTab;
