import React from 'react';
import { LuEye, LuMonitor, LuX } from 'react-icons/lu';
import { CustomTooltip } from '@/components/ui/tooltip';

const ROW_BUTTON_CLASS =
  'flex min-w-0 flex-1 items-center gap-2 rounded-sm px-2 py-1 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-monitor-active-filter';

interface PreviewRowProps {
  label: string;
  filterName: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const PreviewRowContent = ({
  label,
  isOpen,
}: Pick<PreviewRowProps, 'label' | 'isOpen'>) => (
  <>
    <span
      className={`h-1.5 w-1.5 shrink-0 rounded-full ${isOpen ? 'bg-monitor-active-filter' : 'bg-monitor-text-muted/50'}`}
      aria-hidden
    />
    <LuMonitor
      className="h-3.5 w-3.5 shrink-0 text-monitor-text-muted"
      aria-hidden
    />
    <span className="min-w-0 flex-1 truncate">{label}</span>
  </>
);

export const PreviewRow = React.memo(
  ({ label, filterName, isOpen, onOpen, onClose }: PreviewRowProps) => {
    if (isOpen) {
      return (
        <div className="group flex items-center rounded-sm bg-monitor-selection text-[0.929rem] text-monitor-text-primary">
          <button
            type="button"
            onClick={onOpen}
            aria-label={`Show preview ${filterName} ${label}`}
            className={ROW_BUTTON_CLASS}
          >
            <PreviewRowContent label={label} isOpen />
          </button>
          <CustomTooltip content="Close preview" side="right">
            <button
              type="button"
              onClick={onClose}
              aria-label={`Close preview ${filterName} ${label}`}
              className="mr-1 shrink-0 rounded-sm p-0.5 text-monitor-text-muted opacity-0 hover:text-monitor-text-primary focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-monitor-active-filter group-hover:opacity-100"
            >
              <LuX className="h-3.5 w-3.5" />
            </button>
          </CustomTooltip>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open preview ${filterName} ${label}`}
        className={`group ${ROW_BUTTON_CLASS} w-full text-[0.929rem] text-monitor-text-secondary hover:bg-white/5 hover:text-monitor-text-primary`}
      >
        <PreviewRowContent label={label} isOpen={false} />
        <LuEye
          className="h-3.5 w-3.5 shrink-0 text-monitor-active-filter opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
          aria-hidden
        />
      </button>
    );
  },
);

PreviewRow.displayName = 'PreviewRow';
