import { memo } from 'react';
import { LuCamera } from 'react-icons/lu';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { cn } from '@/utils/core';
import type { PIDWithIndex } from '../../../../types';
import PIDPreviewPanel from './PIDPreviewPanel';

interface PIDPreviewButtonProps {
  pid: PIDWithIndex;
  filterIdx: number;
  filterType: string;
  variant: 'input' | 'output';
  onSelect: () => void;
  isPreviewOpen?: boolean;
  onTogglePreview?: (pidIdx: number) => void;
}

const BUTTON_CLASS =
  'rounded bg-gray-700/50 border border-gray-600/50 text-gray-300 hover:bg-gray-700/80 flex-shrink-0';

const PIDPreviewButton = memo(
  ({
    pid,
    filterIdx,
    filterType,
    variant,
    onSelect,
    isPreviewOpen = false,
    onTogglePreview,
  }: PIDPreviewButtonProps) => {
    if (onTogglePreview) {
      return (
        <button
          onClick={() => {
            onSelect();
            onTogglePreview(pid.pidIdx);
          }}
          className={cn(
            BUTTON_CLASS,
            isPreviewOpen &&
              'border-monitor-active-tab text-monitor-active-tab',
          )}
          aria-pressed={isPreviewOpen}
          title={isPreviewOpen ? 'Hide preview' : 'Show preview'}
        >
          <LuCamera className="h-4 w-5" />
        </button>
      );
    }

    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            onClick={onSelect}
            className={BUTTON_CLASS}
            title="Preview frame"
          >
            <LuCamera className="h-4 w-5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <PIDPreviewPanel
            filterIdx={filterIdx}
            filterType={filterType}
            pidIdx={pid.pidIdx}
            variant={variant}
            width={pid.width}
            height={pid.height}
            codec={pid.codec}
            decoderConfig={pid.decoderConfig}
          />
        </PopoverContent>
      </Popover>
    );
  },
);

PIDPreviewButton.displayName = 'PIDPreviewButton';

export default PIDPreviewButton;
