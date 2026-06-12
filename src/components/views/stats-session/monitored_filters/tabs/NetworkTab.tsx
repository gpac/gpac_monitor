import { memo } from 'react';
import { useDataMode } from '@/shared/hooks/data/useDataMode';
import { NetworkTabData } from '@/types/ui';
import { WindowDurationBadge } from '@/components/common/WindowDurationBadge';
import { useChartDuration } from '@/shared/hooks';
import type { ChartDuration } from '@/utils/charts';
import { FilterPerformanceCard } from './network/FilterPerformanceCard';
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
    const { currentStats, formattedStats } = useNetworkMetrics(
      data,
      filterName,
    );

    const { duration, setDuration, windowDuration } = useChartDuration(
      NETWORK_HISTORY_STORAGE_KEY,
      '1min',
      1000,
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

        <FilterPerformanceCard
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
