import { EVENT_FILTER_CHIPS } from './EventsFilter';
import type { TimelineFilter } from './EventsFilter';
import TimelineZoomControls from './TimelineZoomControls';

interface HistoryTimelineHeaderProps {
  title: string;
  activeFilter: TimelineFilter;
  onFilterChange: (filter: TimelineFilter) => void;
  counts: Partial<Record<TimelineFilter, number>>;
  currentTimeLabel: string;
  onZoomIn: () => void;
  onZoomOut: () => void;
  canZoomIn?: boolean;
  canZoomOut?: boolean;
}

const chipButtonClass = (isActive: boolean) =>
  `flex items-center gap-1 px-1.5 py-0.5 text-[11px] whitespace-nowrap rounded-sm border ${
    isActive
      ? 'bg-history-activeBg text-history-activeText border-history-activeBorder'
      : 'border-transparent text-gray-400 hover:text-gray-200'
  }`;

const HistoryTimelineHeader = ({
  title,
  activeFilter,
  onFilterChange,
  counts,
  currentTimeLabel,
  onZoomIn,
  onZoomOut,
  canZoomIn = true,
  canZoomOut = true,
}: HistoryTimelineHeaderProps) => (
  <div className="flex items-center gap-3 h-8 px-3 text-xs text-gray-300 overflow-hidden border-b border-history-border">
    <span className="shrink-0 font-medium truncate max-w-[8rem]">{title}</span>
    <div className="flex items-center gap-1 min-w-0 overflow-hidden">
      {EVENT_FILTER_CHIPS.map(({ value, label, color }) => (
        <button
          key={value}
          type="button"
          onClick={() => onFilterChange(value)}
          className={chipButtonClass(value === activeFilter)}
        >
          {color && (
            <span className={`${color} w-1.5 h-1.5 rounded-full shrink-0`} />
          )}
          <span className="truncate">{label}</span>
          <span className="text-gray-500">{counts[value] ?? 0}</span>
        </button>
      ))}
    </div>
    <span className="ml-auto shrink-0 font-mono tabular-nums text-gray-400">
      {currentTimeLabel}
    </span>
    <TimelineZoomControls
      compact
      onZoomIn={onZoomIn}
      onZoomOut={onZoomOut}
      canZoomIn={canZoomIn}
      canZoomOut={canZoomOut}
    />
  </div>
);

export default HistoryTimelineHeader;
