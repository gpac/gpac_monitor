import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { TimelineEventType } from '@/services/historyService/types';

export type TimelineFilter = 'all' | TimelineEventType;

const CHIPS: Array<{
  value: TimelineFilter;
  label: string;
  icon?: string;
  iconColor?: string;
}> = [
  { value: 'all', label: 'All' },
  { value: 'error', label: 'Errors', icon: '▲', iconColor: 'text-red-500' },
  {
    value: 'graph-change',
    label: 'Graph',
    icon: '◆',
    iconColor: 'text-purple-400',
  },
  {
    value: 'pid-reconfig',
    label: 'PIDs',
    icon: '⚑',
    iconColor: 'text-cyan-400',
  },
  {
    value: 'args-change',
    label: 'Args',
    icon: '∥',
    iconColor: 'text-yellow-400',
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
      {CHIPS.map(({ value, label, icon, iconColor }) => (
        <ToggleGroupItem
          key={value}
          value={value}
          className="data-[state=on]:bg-purple-400/50 data-[state=on]:text-white flex items-center gap-1"
        >
          {icon && <span className={iconColor}>{icon}</span>}
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  </div>
);

export default EventsFilter;
