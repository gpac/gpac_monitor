import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { EVENT_TYPE_COLOR } from './utils/eventTypeColors';
import type { TimelineEventType } from '@/services/historyService/types';

export type TimelineFilter = 'all' | TimelineEventType;

export const EVENT_FILTER_CHIPS: Array<{
  value: TimelineFilter;
  label: string;
  color?: string;
}> = [
  { value: 'all', label: 'All' },
  { value: 'error', label: 'Errors', color: EVENT_TYPE_COLOR.error },
  {
    value: 'graph-change',
    label: 'Graph',
    color: EVENT_TYPE_COLOR['graph-change'],
  },
  {
    value: 'pid-reconfig',
    label: 'PIDs',
    color: EVENT_TYPE_COLOR['pid-reconfig'],
  },
  {
    value: 'args-change',
    label: 'Args',
    color: EVENT_TYPE_COLOR['args-change'],
  },
];

interface EventsFilterProps {
  active: TimelineFilter;
  onChange: (filter: TimelineFilter) => void;
}

const EventsFilter = ({ active, onChange }: EventsFilterProps) => (
  <div className="flex items-center gap-2 px-4 text-xs text-gray-400">
    <span className="shrink-0">Events:</span>
    <ToggleGroup
      type="single"
      value={active}
      onValueChange={(value) => {
        if (value) onChange(value as TimelineFilter);
      }}
    >
      {EVENT_FILTER_CHIPS.map(({ value, label, color }) => (
        <ToggleGroupItem
          key={value}
          value={value}
          className="data-[state=on]:bg-history-activeBg data-[state=on]:text-history-activeText data-[state=on]:border data-[state=on]:border-history-activeBorder flex items-center gap-1.5"
        >
          {color && <span className={`${color} w-1.5 h-1.5 rounded-full`} />}
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  </div>
);

export default EventsFilter;
