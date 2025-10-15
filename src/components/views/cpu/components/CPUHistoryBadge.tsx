import { memo, useState, useEffect } from 'react';
import { LuClock } from 'react-icons/lu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { WidgetStatusBadge } from '@/components/common/WidgetStatusBadge';

export type HistoryDuration = '20s' | '1min' | '5min' | 'unlimited';

interface CPUHistoryBadgeProps {
  value: HistoryDuration;
  onChange: (value: HistoryDuration) => void;
}

const DURATION_LABELS: Record<HistoryDuration, string> = {
  '20s': '20s',
  '1min': '1m',
  '5min': '5m',
  unlimited: '∞',
};

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
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(val) => onChange(val as HistoryDuration)}
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

export const useHistoryDuration = (
  storageKey: string,
  defaultValue: HistoryDuration = '1min',
): [HistoryDuration, (value: HistoryDuration) => void] => {
  const [duration, setDuration] = useState<HistoryDuration>(() => {
    const stored = localStorage.getItem(storageKey);
    return (stored as HistoryDuration) || defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, duration);
  }, [duration, storageKey]);

  return [duration, setDuration];
};

export const getMaxPointsFromDuration = (
  duration: HistoryDuration,
  updateInterval: number,
): number => {
  switch (duration) {
    case '20s':
      return Math.ceil(20000 / updateInterval);
    case '1min':
      return Math.ceil(60000 / updateInterval);
    case '5min':
      return Math.ceil(300000 / updateInterval);
    case 'unlimited':
      return 10000;
    default:
      return 400;
  }
};
