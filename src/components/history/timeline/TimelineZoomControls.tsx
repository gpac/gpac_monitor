import { LuMinus, LuPlus } from 'react-icons/lu';

interface TimelineZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  canZoomIn?: boolean;
  canZoomOut?: boolean;
}

const buttonClass =
  'shrink-0 p-1 2xl:p-1.5 text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none';

const TimelineZoomControls = ({
  onZoomIn,
  onZoomOut,
  canZoomIn = true,
  canZoomOut = true,
}: TimelineZoomControlsProps) => (
  <div className="flex flex-col items-start gap-0.5 px-3 py-1.5 2xl:px-4 2xl:py-2 border border-white/10 bg-white/[0.03]">
    <span className="text-xs 2xl:text-sm capitalize tracking-wide text-gray-500">
      Zoom
    </span>
    <span className="flex items-center gap-2">
      <button
        type="button"
        onClick={onZoomOut}
        disabled={!canZoomOut}
        className={buttonClass}
        aria-label="Zoom out"
      >
        <LuMinus className="w-4 h-4 2xl:w-5 2xl:h-5" />
      </button>
      <button
        type="button"
        onClick={onZoomIn}
        disabled={!canZoomIn}
        className={buttonClass}
        aria-label="Zoom in"
      >
        <LuPlus className="w-4 h-4 2xl:w-5 2xl:h-5" />
      </button>
    </span>
  </div>
);

export default TimelineZoomControls;
