import React from 'react';
import { LuChevronDown, LuChevronUp } from 'react-icons/lu';
import { Badge } from '@/components/ui/badge';
import { MonitoredBadge } from '@/components/ui/MonitoredBadge';
import { getBufferProgressColor } from '@/utils/metrics';
import { EnrichedFilterData } from '@/workers/enrichedStatsWorker';
import { useFilterCardState } from '../../hooks/filterCard';
import { FilterMetrics } from './FilterMetrics';
import { FilterExpandedDetails } from './FilterExpandedDetails';
import { FilterActivityIndicator } from './FilterActivityIndicator';
import RenderCount from '@/components/views/graph/ui/graph/RenderCount';

interface FilterStatCardProps {
  filter: EnrichedFilterData;
  onClick?: (idx: number) => void;
  isMonitored?: boolean;
  isDetached?: boolean;
}

const FilterStatCard: React.FC<FilterStatCardProps> = ({
  filter,
  onClick,
  isMonitored = false,
  isDetached = false,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const { handleClick, ringClass, cursorClass } = useFilterCardState({
    filterIdx: filter.idx,
    isMonitored,
    isDetached,
    onClick,
  });

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  const {
    bufferUsage,
    activityColor,
    activityLabel,
    sessionType,
    formattedBytes,
    formattedTime,
    formattedPackets,
  } = filter.computed;

  const hasBufferInfo = filter.ipid && Object.keys(filter.ipid).length > 0;
  const hasPackets = Boolean(filter.pck_done && filter.pck_done > 0);
  const hasTime = Boolean(filter.time && filter.time > 0);
  const bufferColor = getBufferProgressColor(bufferUsage);

  const sessionTypeLabel =
    sessionType === 'source'
      ? 'Source'
      : sessionType === 'sink'
        ? 'Sink'
        : 'Process';

  return (
    <div
      className={`
          flex flex-col gap-1 p-2.5 rounded-lg
          bg-monitor-panel border-transparent
          transition-colors
          ${ringClass} ${cursorClass}
        `}
      onClick={handleClick}
    >
      <RenderCount componentName={`FilterStatCard-${filter.name}`} />
      {/* Compact view - Line 1: Name + Type + Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MonitoredBadge
            isMonitored={isMonitored && !isDetached}
            title="Filter is monitored"
          />
          <span className="font-ui font-semibold text-sm text-monitor-text-primary truncate">
            {filter.name}
          </span>
          <span className="text-xs text-monitor-text-subtle">·</span>
          <Badge
            variant="outline"
            className="h-4 px-1.5 py-0 text-xs ring-1 ring-monitor-line bg-white/5 text-monitor-text-secondary"
          >
            {sessionTypeLabel}
          </Badge>
        </div>

        <FilterActivityIndicator
          activityColor={activityColor}
          activityLabel={activityLabel}
        />
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={handleToggleExpand}
            className="ml-1 p-0.5 hover:bg-white/10 rounded transition-colors no-drag"
            title={isExpanded ? 'Show less' : 'Show more'}
          >
            {isExpanded ? (
              <LuChevronUp className="h-3 w-3 text-monitor-text-muted" />
            ) : (
              <LuChevronDown className="h-3 w-3 text-monitor-text-muted" />
            )}
          </button>
        </div>
      </div>

      {/* Compact view - Line 2: Metrics (isolated component) */}
      <FilterMetrics
        formattedPackets={formattedPackets}
        formattedBytes={formattedBytes}
        formattedTime={formattedTime}
        errors={filter.errors || 0}
        hasPackets={hasPackets}
        hasTime={hasTime}
      />

      {/* Expanded view - All details (isolated component) */}
      {isExpanded && (
        <FilterExpandedDetails
          nbIpid={filter.nb_ipid || 0}
          nbOpid={filter.nb_opid || 0}
          formattedBytes={formattedBytes}
          activityColor={activityColor}
          activityLabel={activityLabel}
          bufferUsage={bufferUsage}
          bufferColor={bufferColor}
          hasBufferInfo={hasBufferInfo}
        />
      )}
    </div>
  );
};

FilterStatCard.displayName = 'FilterStatCard';

export default FilterStatCard;
