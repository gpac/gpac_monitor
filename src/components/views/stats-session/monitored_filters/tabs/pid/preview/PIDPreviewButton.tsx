import { memo } from 'react';
import { LuCamera } from 'react-icons/lu';
import { cn } from '@/utils/core';
import type { PIDWithIndex } from '../../../../types';

interface PIDPreviewButtonProps {
  pid: PIDWithIndex;
  onSelect: () => void;
  isPreviewOpen: boolean;
  onTogglePreview: (pidIdx: number) => void;
}

const PIDPreviewButton = memo(
  ({
    pid,
    onSelect,
    isPreviewOpen,
    onTogglePreview,
  }: PIDPreviewButtonProps) => (
    <button
      onClick={() => {
        onSelect();
        onTogglePreview(pid.pidIdx);
      }}
      className={cn(
        'rounded bg-gray-700/50 border border-gray-600/50 text-gray-300 hover:bg-gray-700/80 flex-shrink-0',
        isPreviewOpen && 'border-monitor-active-tab text-monitor-active-tab',
      )}
      aria-pressed={isPreviewOpen}
      title={isPreviewOpen ? 'Hide preview' : 'Show preview'}
    >
      <LuCamera className="h-4 w-5" />
    </button>
  ),
);

PIDPreviewButton.displayName = 'PIDPreviewButton';

export default PIDPreviewButton;
