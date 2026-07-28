import { LuMinus, LuPlus } from 'react-icons/lu';

interface TimelineZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  canZoomIn?: boolean;
  canZoomOut?: boolean;
}

const buttonClass =
  'p-1 rounded-sm text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none';

const TimelineZoomControls = ({
  onZoomIn,
  onZoomOut,
  canZoomIn = true,
  canZoomOut = true,
}: TimelineZoomControlsProps) => (
  <div className="flex items-center gap-1 shrink-0">
    <button
      type="button"
      onClick={onZoomOut}
      disabled={!canZoomOut}
      className={buttonClass}
      aria-label="Zoom out"
    >
      <LuMinus className="w-4 h-4" />
    </button>
    <button
      type="button"
      onClick={onZoomIn}
      disabled={!canZoomIn}
      className={buttonClass}
      aria-label="Zoom in"
    >
      <LuPlus className="w-4 h-4" />
    </button>
  </div>
);

export default TimelineZoomControls;
