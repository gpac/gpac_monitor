import { memo, useMemo } from 'react';
import { LuClock } from 'react-icons/lu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { WidgetStatusBadge } from '@/components/widget/WidgetStatusBadge';
import { ChartDuration, DURATION_LABELS } from '@/utils/charts';

const ALL_DURATIONS: ChartDuration[] = [
  '20s',
  '1min',
  '5min',
  '10min',
  'unlimited',
];

const ITEM_FULL_LABELS: Record<ChartDuration, string> = {
  '20s': '20 seconds',
  '1min': '1 minute',
  '5min': '5 minutes',
  '10min': '10 minutes',
  unlimited: 'Unlimited',
};

interface WindowDurationBadgeProps {
  value: ChartDuration;
  onChange: (value: ChartDuration) => void;
  options?: ChartDuration[];
}

export const WindowDurationBadge = memo<WindowDurationBadgeProps>(
  ({ value, onChange, options }) => {
    const items = useMemo(() => options ?? ALL_DURATIONS, [options]);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="px-0 py-0">
            <WidgetStatusBadge
              icon={<LuClock className="w-4 h-4 text-info" />}
              className="cursor-pointer hover:opacity-80 "
            >
              <span className="text-sm font-medium text-info">
                {DURATION_LABELS[value]}
              </span>
            </WidgetStatusBadge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-monitor-surface">
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(next) => onChange(next as ChartDuration)}
          >
            {items.map((duration) => (
              <DropdownMenuRadioItem key={duration} value={duration}>
                {ITEM_FULL_LABELS[duration]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
);

WindowDurationBadge.displayName = 'WindowDurationBadge';
