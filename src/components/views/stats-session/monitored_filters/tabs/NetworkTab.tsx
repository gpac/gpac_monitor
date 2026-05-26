import { memo, useMemo } from 'react';
import { LuUpload, LuDownload } from 'react-icons/lu';
import { useDataMode } from '@/shared/hooks/data/useDataMode';
import { NetworkTabData } from '@/types/ui';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WindowDurationBadge } from '@/components/common/WindowDurationBadge';
import { useChartDuration } from '@/shared/hooks';
import type { ChartDuration } from '@/utils/charts';
import { BandwidthCombinedChart } from '../charts/BandwidthCombinedChart';
import { useNetworkMetrics } from '../../hooks/data/useNetworkMetrics';
import { TAB_STYLES } from './styles';
import { formatMicroseconds } from '@/utils/formatting/time';
import { useIsDetached } from '../FilterViewContext';

interface NetworkTabProps {
  filterId: string;
  data: NetworkTabData;
  filterName: string;
  lastTaskTimeUs?: number;
}

const NETWORK_DURATION_OPTIONS: ChartDuration[] = [
  '20s',
  '1min',
  '5min',
  '10min',
];
const NETWORK_HISTORY_STORAGE_KEY = 'gpac-network-history';

const NetworkTab = memo(
  ({ filterId, data, filterName, lastTaskTimeUs }: NetworkTabProps) => {
    const { isHistory } = useDataMode();
    const isDetached = useIsDetached();
    const { currentStats, instantRates, formattedStats, getActivityLevel } =
      useNetworkMetrics(data, filterName);

    const { duration, setDuration, windowDuration } = useChartDuration(
      NETWORK_HISTORY_STORAGE_KEY,
      '1min',
      1000,
    );

    const outbandActivity = useMemo(
      () => getActivityLevel(instantRates.bytesSentRate),
      [instantRates.bytesSentRate, getActivityLevel],
    );

    const inbandActivity = useMemo(
      () => getActivityLevel(instantRates.bytesReceivedRate),
      [instantRates.bytesReceivedRate, getActivityLevel],
    );

    return (
      <div className="flex flex-col gap-1 p-1">
        {/* Status bar with inline rates */}
        <div className={TAB_STYLES.STATUS_BAR}>
          <span className={TAB_STYLES.STATUS_LABEL}>{filterName}</span>
          <span className="font-medium text-info">Stats</span>
          <span className={TAB_STYLES.STATUS_SEPARATOR}>·</span>
          <span className="text-monitor-active-filter tabular-nums font-mono">
            ↓ {formattedStats.bytesReceivedRate}
          </span>
          <span className="text-emerald-400 tabular-nums font-mono">
            ↑ {formattedStats.bytesSentRate}
          </span>
          <span className={TAB_STYLES.STATUS_SEPARATOR}>·</span>
          <span className="text-amber-400 tabular-nums font-mono">
            {formatMicroseconds(lastTaskTimeUs)}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {!isHistory && !isDetached && (
              <WindowDurationBadge
                value={duration}
                onChange={setDuration}
                options={NETWORK_DURATION_OPTIONS}
              />
            )}
            <span className="text-muted-foreground/70 text-xs">
              {isHistory ? 'History' : 'Live'}{' '}
              <span className={isHistory ? 'text-purple-400' : 'text-error'}>
                ⏺
              </span>
            </span>
          </div>
        </div>

        {/* Stats cards - 2 columns */}
        <div className={TAB_STYLES.GRID_2_COL}>
          <Card className="bg-monitor-panel border-transparent">
            <CardContent className="p-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-0.5 h-5 rounded-full bg-blue-500" />
                    <LuDownload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      INBAND
                    </span>
                  </div>
                  <Badge
                    variant={inbandActivity.variant}
                    className="text-[11px] h-5 px-2"
                  >
                    {inbandActivity.level}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-1.5 leading-none">
                  <span className="text-xl font-bold text-monitor-download tabular-nums">
                    {isHistory
                      ? formattedStats.bytesReceived
                      : formattedStats.bytesReceivedRate}
                  </span>
                  {isHistory && (
                    <span className="text-[10px] text-muted-foreground font-normal">
                      cumulative
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {!isHistory && (
                    <>
                      <span className="font-medium">
                        {formattedStats.bytesReceived}
                      </span>
                      <span className="mx-1.5">·</span>
                    </>
                  )}
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-0.5 h-5 rounded-full bg-emerald-500" />
                    <LuUpload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      OUTBAND
                    </span>
                  </div>
                  <Badge
                    variant={outbandActivity.variant}
                    className="text-[11px] h-5 px-2"
                  >
                    {outbandActivity.level}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-1.5 leading-none">
                  <span className="text-xl font-bold text-emerald-500 tabular-nums">
                    {isHistory
                      ? formattedStats.bytesSent
                      : formattedStats.bytesSentRate}
                  </span>
                  {isHistory && (
                    <span className="text-[10px] text-muted-foreground font-normal">
                      cumulative
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {!isHistory && (
                    <>
                      <span className="font-medium">
                        {formattedStats.bytesSent}
                      </span>
                      <span className="mx-1.5">·</span>
                    </>
                  )}
                  <span className="font-medium">
                    {formattedStats.packetsSent} packets
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Combined chart */}
        <BandwidthCombinedChart
          filterId={filterId}
          bytesSent={currentStats.bytesSent}
          bytesReceived={currentStats.bytesReceived}
          lastTaskTimeUs={lastTaskTimeUs}
          windowDurationMs={isHistory ? undefined : windowDuration}
          showCurrentTime
        />
      </div>
    );
  },
);

NetworkTab.displayName = 'NetworkTab';

export default NetworkTab;
