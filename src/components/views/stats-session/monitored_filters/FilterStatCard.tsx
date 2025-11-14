import React, { useCallback, useMemo, memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { MonitoredBadge } from '@/components/ui/MonitoredBadge';
import { EnrichedFilterData } from '@/workers/enrichedStatsWorker';

interface FilterStatCardProps {
  filter: EnrichedFilterData;
  onClick?: (idx: number) => void;
  isMonitored?: boolean;
  isDetached?: boolean;
}

const FilterStatCard: React.FC<FilterStatCardProps> = memo(
  ({ filter, onClick, isMonitored = false, isDetached = false }) => {
    const handleClick = useCallback(() => {
      if (onClick && filter.idx !== undefined) {
        onClick(filter.idx);
      }
    }, [filter.idx, onClick]);

    const {
      activityColor,
      activityLabel,
      sessionType,
      formattedBytes,
      formattedTime,
      formattedPackets,
    } = filter.computed;

    const hasPackets = Boolean(filter.pck_done && filter.pck_done > 0);
    const hasTime = Boolean(filter.time && filter.time > 0);

    const isMonitoredOrDetached = useMemo(
      () => isMonitored || isDetached,
      [isMonitored, isDetached],
    );

    const ringClass = useMemo(() => {
      return isMonitoredOrDetached
        ? 'ring-2 ring-red-700/90'
        : 'ring-1 ring-transparent hover:ring-monitor-accent/40';
    }, [isMonitoredOrDetached]);

    const cursorClass = useMemo(
      () =>
        isDetached
          ? 'cursor-not-allowed opacity-60'
          : 'cursor-pointer hover:bg-white/4',
      [isDetached],
    );

    const sessionTypeLabel =
      sessionType === 'source'
        ? 'Source'
        : sessionType === 'sink'
          ? 'Sink'
          : 'Process';

    return (
      <div
        className={`flex flex-col gap-1.5 p-2.5 rounded-lg bg-monitor-panel border-transparent transition-colors ${ringClass} ${cursorClass}`}
        onClick={handleClick}
      >
        {/* Line 1: Name + Type + Activity */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <MonitoredBadge
              isMonitored={isMonitored && !isDetached}
              title="Filter is monitored"
            />
            <span className="font-ui font-semibold text-sm text-monitor-text-primary truncate">
              {filter.name}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant="outline"
              className="h-5 px-1.5 text-xs ring-1 ring-monitor-line bg-white/5 text-monitor-text-secondary"
            >
              {sessionTypeLabel}
            </Badge>
            <div className="flex items-center gap-1">
              <div className={`h-2 w-2 rounded-full ${activityColor}`} />
              <span className="text-xs font-medium text-monitor-text-secondary">
                {activityLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Line 2: Metrics + PIDs */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-mono  tabular-nums text-monitor-text-muted">
            {hasPackets && (
              <>
                <span>{formattedPackets} pkt</span>
                <span className="text-monitor-text-subtle ">•</span>
              </>
            )}
            {formattedBytes && (
              <>
                <span>{formattedBytes}</span>
                {hasTime && <span className="text-monitor-text-subtle">•</span>}
              </>
            )}
            {hasTime && <span>{formattedTime}</span>}
            {filter.errors && filter.errors > 0 && (
              <>
                <span className="text-monitor-text-subtle">•</span>
                <span className="text-rose-400">{filter.errors} err</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 font-mono tabular-nums text-monitor-text-muted shrink-0">
            <span className="text-[10px] uppercase tracking-wider">PIDs</span>
            <span>
              {filter.nb_ipid || 0}/{filter.nb_opid || 0}
            </span>
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if displayed values actually changed
    const prev = prevProps.filter;
    const next = nextProps.filter;

    return (
      prev.idx === next.idx &&
      prev.name === next.name &&
      prev.nb_ipid === next.nb_ipid &&
      prev.nb_opid === next.nb_opid &&
      prev.errors === next.errors &&
      prev.computed.formattedPackets === next.computed.formattedPackets &&
      prev.computed.formattedBytes === next.computed.formattedBytes &&
      prev.computed.formattedTime === next.computed.formattedTime &&
      prev.computed.activityColor === next.computed.activityColor &&
      prev.computed.activityLabel === next.computed.activityLabel &&
      prev.computed.sessionType === next.computed.sessionType &&
      prevProps.isMonitored === nextProps.isMonitored &&
      prevProps.isDetached === nextProps.isDetached &&
      prevProps.onClick === nextProps.onClick
    );
  },
);

FilterStatCard.displayName = 'FilterStatCard';

export default FilterStatCard;
