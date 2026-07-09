import { LuMinus, LuPlus } from 'react-icons/lu';

interface TimelineZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  canZoomIn?: boolean;
  canZoomOut?: boolean;
  /** Icon-only, no border/label — fits a 32-36px header row. */
  compact?: boolean;
}

const buttonClass =
  'shrink-0 p-1 2xl:p-1.5 text-gray-300 hover:text-white hover:bg-history-muted disabled:opacity-40 disabled:pointer-events-none';

const compactButtonClass =
  'p-0.5 text-gray-400 hover:text-white disabled:opacity-40 disabled:pointer-events-none';

const TimelineZoomControls = ({
  onZoomIn,
  onZoomOut,
  canZoomIn = true,
  canZoomOut = true,
  compact = false,
}: TimelineZoomControlsProps) => {
  const iconClass = compact ? 'w-3.5 h-3.5' : 'w-4 h-4 2xl:w-5 2xl:h-5';
  const zoomOutButton = (
    <button
      type="button"
      onClick={onZoomOut}
      disabled={!canZoomOut}
      className={compact ? compactButtonClass : buttonClass}
      aria-label="Zoom out"
    >
      <LuMinus className={iconClass} />
    </button>
  );
  const zoomInButton = (
    <button
      type="button"
      onClick={onZoomIn}
      disabled={!canZoomIn}
      className={compact ? compactButtonClass : buttonClass}
      aria-label="Zoom in"
    >
      <LuPlus className={iconClass} />
    </button>
  );

  if (compact) {
    return (
      <div className="flex items-center gap-0.5 shrink-0">
        {zoomOutButton}
        {zoomInButton}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-0.5 px-3 py-1.5 2xl:px-4 2xl:py-2 border border-history-border bg-white/[0.03]">
      <span className="text-xs 2xl:text-sm capitalize tracking-wide text-gray-500">
        Zoom
      </span>
      <span className="flex items-center gap-2">
        {zoomOutButton}
        {zoomInButton}
      </span>
    </div>
  );
};

export default TimelineZoomControls;
