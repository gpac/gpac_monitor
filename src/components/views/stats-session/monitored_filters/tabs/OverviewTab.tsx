import { memo } from 'react';
import { OverviewTabData } from '@/types/domain/gpac/filter-stats';
import { PacketsCard, DataCard, RealtimeMetricsCard } from '../cards';
import { Badge } from '@/components/ui/badge';
import { formatTime } from '@/utils/formatting';
import { getFilterHealthInfo } from '../cards/shared/statusHelpers';
import { TAB_STYLES } from './styles';

interface OverviewTabProps {
  filter: OverviewTabData;
}

const OverviewTab = memo(({ filter }: OverviewTabProps) => {
  const { status, type, idx, time } = filter;
  const healthInfo = getFilterHealthInfo(status);
  const formattedUptime = formatTime(time);

  return (
    <div className="flex flex-col h-full gap-2 p-2">
      {/* ROW 1: Status Strip Bar - Single compact line */}
      <div className="flex items-center gap-2 px-3 py-2 bg-monitor-panel/40 rounded border-b border-monitor-line/10 text-xs shrink-0">
        <span className="font-medium text-info">[{type || 'unknown'}]</span>
        <Badge
          variant={healthInfo.variant}
          className="text-xs py-0 px-1.5 h-fit"
        >
          ● {healthInfo.label}
        </Badge>
        <span className="text-muted-foreground/50">·</span>
        <span className="text-muted-foreground">Index: {idx}</span>
        <span className="text-muted-foreground/50">·</span>
        <span className="text-muted-foreground">
          Uptime:{' '}
          <span className="font-medium tabular-nums">{formattedUptime}</span>
        </span>
        <span className="ml-auto text-muted-foreground/70 text-xs">
          Live <span className="text-error ">⏺</span>
        </span>
      </div>

      {/* ROW 2: Compact KPIs grid - Auto-adaptive based on container width */}
      <div className={TAB_STYLES.GRID_AUTO_FIT}>
        {/* Column 1: Filter Health + PIDs */}
        <div className="flex flex-col gap-2">
          {/* Compact Health Card */}
          <div className="bg-monitor-panel/60 border-r border-monitor-line/10 rounded p-2">
            <div className="text-xs font-medium text-info mb-1">Health</div>
            <div className={`text-xs font-medium ${healthInfo.color} py-1`}>
              {status || 'Unknown'}
            </div>
          </div>
          {/* Compact PIDs Card */}
          <div className="bg-monitor-panel/60 border-0 border-r border-monitor-line/10 rounded p-2">
            <div className="text-xs font-medium text-info mb-1">PIDs</div>
            <div className="text-xs space-y-0.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ipid:</span>
                <span className="font-medium">{filter.nb_ipid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Opid:</span>
                <span className="font-medium">{filter.nb_opid}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Realtime Metrics */}
        <div className="flex flex-col gap-2">
          <RealtimeMetricsCard filter={filter} />
        </div>

        {/* Column 3: Packets & Data */}
        <div className="flex flex-col gap-2">
          <PacketsCard
            pck_done={filter.pck_done}
            pck_sent={filter.pck_sent}
            pck_ifce_sent={filter.pck_ifce_sent}
          />
          <DataCard
            bytes_done={filter.bytes_done}
            bytes_sent={filter.bytes_sent}
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {/* Space for collapsible sections in the future */}
      </div>
    </div>
  );
});

OverviewTab.displayName = 'OverviewTab';

export default OverviewTab;
