import { memo } from 'react';
import { NetworkTabData } from '@/types/ui';
import { WindowDurationBadge } from '@/components/common/WindowDurationBadge';
import { useChartDuration } from '@/shared/hooks';
import type { ChartDuration } from '@/utils/charts';
import { BandwidthCombinedChart } from '../charts/BandwidthCombinedChart';
import { useNetworkMetrics } from '../../hooks/data/useNetworkMetrics';
import { TAB_STYLES } from './styles';
import { formatMicroseconds } from '@/utils';

interface NetworkTabProps {
  filterId: string;
  data: NetworkTabData;
  filterName: string;
  refreshInterval: number;
  filterTimeUs?: number;
}

const NETWORK_DURATION_OPTIONS: ChartDuration[] = [
  '20s',
  '1min',
  '5min',
  '10min',
];
const NETWORK_HISTORY_STORAGE_KEY = 'gpac-network-history';

const NetworkTab = memo(
  ({
    filterId,
    data,
    filterName,
    refreshInterval,
    filterTimeUs,
  }: NetworkTabProps) => {
    const { currentStats, formattedStats } = useNetworkMetrics(
      data,
      filterName,
    );

    const { duration, setDuration, windowDuration } = useChartDuration(
      NETWORK_HISTORY_STORAGE_KEY,
      '1min',
      refreshInterval,
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
            {formatMicroseconds(filterTimeUs)}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <WindowDurationBadge
              value={duration}
              onChange={setDuration}
              options={NETWORK_DURATION_OPTIONS}
            />
            <span className="text-muted-foreground/70 text-xs">
              Live <span className="text-error">⏺</span>
            </span>
          </div>
        </div>

        <BandwidthCombinedChart
          filterId={filterId}
          bytesSent={currentStats.bytesSent}
          bytesReceived={currentStats.bytesReceived}
          filterTimeUs={filterTimeUs}
          refreshInterval={refreshInterval}
          windowDurationMs={windowDuration}
        />
      </div>
    );
  },
);

NetworkTab.displayName = 'NetworkTab';

export default NetworkTab;
