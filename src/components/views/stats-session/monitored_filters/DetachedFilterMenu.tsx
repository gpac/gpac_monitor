import { LuChevronDown } from 'react-icons/lu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { DetachedFilterOption } from '../hooks/filters/useDetachedFilterSelector';

interface DetachedFilterMenuProps {
  currentName: string;
  options: DetachedFilterOption[];
  onSelect: (option: DetachedFilterOption) => void;
}

export const DetachedFilterMenu = ({
  currentName,
  options,
  onSelect,
}: DetachedFilterMenuProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        className="no-drag flex items-center gap-2 rounded px-1 hover:bg-gray-600 focus-visible:outline focus-visible:outline-2"
        aria-label="Change detached filter"
      >
        {currentName}
        <LuChevronDown className="h-4 w-4" aria-hidden="true" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="start"
      className="no-drag max-h-80 overflow-y-auto"
    >
      {options.map((option) => (
        <DropdownMenuItem
          key={option.idx}
          disabled={option.isCurrent || option.isDetachedElsewhere}
          onSelect={() => onSelect(option)}
        >
          <span>{option.name}</span>
          <span className="ml-3 text-xs text-monitor-text-muted">
            #{option.idx}
            {option.isCurrent ? ' · Current' : ''}
            {option.isDetachedElsewhere ? ' · Detached elsewhere' : ''}
          </span>
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);
