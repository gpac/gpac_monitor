import React from 'react';
import { LuMonitor, LuX } from 'react-icons/lu';

interface PreviewRowProps {
  label: string;
  filterName: string;
  isOpen: boolean;
  disabled: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const PreviewRow = React.memo(
  ({
    label,
    filterName,
    isOpen,
    disabled,
    onOpen,
    onClose,
  }: PreviewRowProps) => {
    if (isOpen) {
      return (
        <div className="group flex items-center gap-2 rounded bg-monitor-selection px-2 py-1 text-monitor-text-primary">
          <span
            className="h-2 w-2 rounded-full bg-monitor-active-filter"
            aria-hidden
          />
          <LuMonitor
            className="h-3.5 w-3.5 text-monitor-text-muted"
            aria-hidden
          />
          <span className="flex-1 truncate">{label}</span>
          <button
            type="button"
            onClick={onClose}
            disabled={disabled}
            title="Close preview"
            aria-label={`Close preview ${filterName} ${label}`}
            className="text-monitor-text-muted opacity-0 hover:text-monitor-text-primary focus-visible:opacity-100 group-hover:opacity-100 disabled:hidden"
          >
            <LuX className="h-3.5 w-3.5" />
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={onOpen}
        disabled={disabled}
        className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-monitor-text-secondary hover:bg-white/5 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        <span
          className="h-2 w-2 rounded-full border border-monitor-text-muted"
          aria-hidden
        />
        <LuMonitor
          className="h-3.5 w-3.5 text-monitor-text-muted"
          aria-hidden
        />
        <span className="truncate">{label}</span>
      </button>
    );
  },
);

PreviewRow.displayName = 'PreviewRow';
