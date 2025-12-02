import { memo } from 'react';
import { LuClock } from 'react-icons/lu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { WidgetStatusBadge } from '@/components/Widget/WidgetStatusBadge';
import { ChartDuration, DURATION_LABELS } from '@/utils/charts';

interface CPUHistoryBadgeProps {
  value: ChartDuration;
  onChange: (value: ChartDuration) => void;
}

/**
 * CPU History Duration Selector - UI Component
 * Displays and allows selection of chart history duration
 */
export const CPUHistoryBadge = memo<CPUHistoryBadgeProps>(
  ({ value, onChange }) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="px-0 py-0">
            <WidgetStatusBadge
              icon={<LuClock className="w-4 h-4 text-info" />}
              className="cursor-pointer hover:opacity-80 transition-opacity"
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
            onValueChange={(val) => onChange(val as ChartDuration)}
          >
            <DropdownMenuRadioItem value="20s">
              20 seconds
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="1min">1 minute</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="5min">
              5 minutes
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="unlimited">
              Unlimited
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
);

CPUHistoryBadge.displayName = 'CPUHistoryBadge';
