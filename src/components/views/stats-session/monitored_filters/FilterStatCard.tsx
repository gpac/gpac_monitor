import { useCallback, memo } from 'react';
import { LuActivity } from 'react-icons/lu';
import { Badge } from '@/components/ui/badge';
import { MonitoredBadge } from '@/components/ui/MonitoredBadge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getBufferProgressColor } from '@/utils/metrics';
import { EnrichedFilterData } from '@/workers/enrichedStatsWorker';

interface FilterStatCardProps {
  filter: EnrichedFilterData;
  onClick?: (idx: number) => void;
  isMonitored?: boolean;
  isDetached?: boolean;
}

const FilterStatCard: React.FC<FilterStatCardProps> = memo(
  ({ filter, onClick, isMonitored = false, isDetached = false }) => {
    const {
      bufferUsage,
      activityColor,
      activityLabel,
      sessionType,
      formattedBytes,
      formattedTime,
      formattedPackets,
    } = filter.computed;

    const handleClick = useCallback(() => {
      if (onClick && filter.idx !== undefined) {
        onClick(filter.idx);
      }
    }, [filter.idx, onClick]);

    // Monitored (inline or detached) = highlighted ring
    const isMonitoredOrDetached = isMonitored || isDetached;
    const ringClass = isMonitoredOrDetached
      ? 'ring-2 ring-red-700/90'
      : 'ring-1 ring-transparent hover:ring-monitor-accent/40';

    const cursorClass = isDetached
      ? 'cursor-not-allowed opacity-60'
      : 'cursor-pointer hover:bg-white/4';

    const hasBufferInfo = filter.ipid && Object.keys(filter.ipid).length > 0;
    const hasPackets = filter.pck_done && filter.pck_done > 0;
    const hasTime = filter.time && filter.time > 0;
    const bufferColor = getBufferProgressColor(bufferUsage);

    return (
      <Card
        className={`bg-stat overflow-hidden transition-colors bg-monitor-panel border-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400/30 ${ringClass} ${cursorClass}`}
        onClick={handleClick}
      >
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium truncate tracking-tight text-monitor-text-primary">
              {filter.name}
            </CardTitle>
            <div className="flex items-center gap-1 ml-2">
              <MonitoredBadge
                isMonitored={isMonitoredOrDetached}
                title={
                  isDetached
                    ? 'Filter is monitored (detached view)'
                    : isMonitored
                      ? 'Filter is monitored (inline view)'
                      : ''
                }
              />
              <Badge
                variant={
                  sessionType === 'source'
                    ? 'outline'
                    : sessionType === 'sink'
                      ? 'outline'
                      : 'secondary'
                }
                className={`h-2 px-2 text-[10px] leading-none capitalize ring-1 ring-monitor-line bg-white/5 text-monitor-text-secondary`}
                style={{
                  minHeight: '16px',
                  paddingTop: '0',
                  paddingBottom: '0',
                }}
              >
                <span className="">{sessionType}</span>
              </Badge>
            </div>
          </div>
          <CardDescription className="mt-1 flex items-center gap-1 text-xs text-monitor-text-muted">
            <LuActivity className="h-3 w-3" />
            <span className="truncate text-info">
              {filter.status || 'No status'}
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 p-3 pt-0">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-xs mb-1 text-monitor-text-muted">
                <span>I/O PIDs</span>
              </div>
              <p className="text-xs font-medium tabular-nums text-monitor-text-secondary">
                {filter.nb_ipid || 0}/{filter.nb_opid || 0}
              </p>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-xs text-monitor-text-muted mb-1">
                <span className="stat stat-label">Data</span>
              </div>
              <p className="text-xs font-medium tabular-nums text-monitor-text-secondary">
                {formattedBytes}
              </p>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-xs text-monitor-text-muted mb-1">
                <LuActivity className="h-3 w-3" />
                <span className="stat stat-label">Activity</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`h-2 w-2 rounded-full ${activityColor}`} />
                <span className="text-xs text-monitor-text-secondary">
                  {activityLabel}
                </span>
              </div>
            </div>
          </div>

          {hasBufferInfo && (
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-xs text-monitor-text-muted">
                  Buffer usage
                </span>
                <span className="text-xs tabular-nums text-monitor-text-secondary">
                  {bufferUsage}%
                </span>
              </div>
              <Progress
                value={bufferUsage}
                className="h-1.5"
                color={bufferColor}
              />
            </div>
          )}

          <div className="flex justify-between items-center gap-1 text-xs">
            {hasPackets && (
              <Badge
                variant="outline"
                className="h-4 px-1.5 py-0 text-xs ring-1 ring-monitor-line bg-white/5 text-monitor-text-secondary"
              >
                {formattedPackets} pkt
              </Badge>
            )}
            {hasTime && (
              <Badge variant="outline" className="h-4 px-1.5 py-0 text-xs">
                <span className="stat-value">{formattedTime}</span>
              </Badge>
            )}
            {filter.errors && filter.errors > 0 && (
              <Badge variant="destructive" className="h-4 px-1.5 py-0 text-xs">
                <span className="tabular-nums">{filter.errors} err</span>
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    const prev = prevProps.filter;
    const next = nextProps.filter;

    return (
      prev.idx === next.idx &&
      prev.bytes_done === next.bytes_done &&
      prev.pck_done === next.pck_done &&
      prev.time === next.time &&
      prev.status === next.status &&
      prev.errors === next.errors &&
      prev.nb_ipid === next.nb_ipid &&
      prev.nb_opid === next.nb_opid &&
      prevProps.isDetached === nextProps.isDetached &&
      prevProps.isMonitored === nextProps.isMonitored
    );
  },
);

FilterStatCard.displayName = 'FilterStatCard';

export default FilterStatCard;
