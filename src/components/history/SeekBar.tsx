import * as Slider from '@radix-ui/react-slider';
import { useEffect, useState } from 'react';

interface SeekBarProps {
  progressPercent: number;
  onSeekPositionChange: (positionPercent: number) => void;
  formatTooltip: (positionPercent: number) => string;
  disabled?: boolean;
  /** Chunk boundary positions as percentages (0–100). First boundary (0%) is omitted. */
  segmentMarkers?: number[];
}

const SeekBar = ({
  progressPercent,
  onSeekPositionChange,
  formatTooltip,
  disabled,
  segmentMarkers,
}: SeekBarProps) => {
  const [previewPercent, setPreviewPercent] = useState<number | null>(null);
  const [pendingSeekPercent, setPendingSeekPercent] = useState<number | null>(
    null,
  );
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);

  useEffect(() => {
    if (
      pendingSeekPercent !== null &&
      Math.abs(progressPercent - pendingSeekPercent) < 0.05
    ) {
      setPendingSeekPercent(null);
    }
  }, [progressPercent, pendingSeekPercent]);

  const displayPercent =
    previewPercent ?? pendingSeekPercent ?? progressPercent;
  const tooltipPercent = previewPercent ?? hoverPercent;

  return (
    <div className="relative flex-1">
      {tooltipPercent !== null && (
        <div
          className="absolute -top-5 -translate-x-1/2 bg-gray-800 text-gray-200 text-[10px] py-0.5 rounded pointer-events-none whitespace-nowrap z-10"
          style={{ left: `${tooltipPercent}%` }}
        >
          {formatTooltip(tooltipPercent)}
        </div>
      )}
      <Slider.Root
        min={0}
        max={100}
        step={0.01}
        value={[displayPercent]}
        onValueChange={([value]) => setPreviewPercent(value)}
        onValueCommit={([value]) => {
          setPreviewPercent(null);
          setPendingSeekPercent(value);
          onSeekPositionChange(value);
        }}
        disabled={disabled}
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setHoverPercent(
            Math.max(
              0,
              Math.min(100, ((event.clientX - rect.left) / rect.width) * 100),
            ),
          );
        }}
        onMouseLeave={() => setHoverPercent(null)}
        className={`relative flex items-center w-full h-6 ${disabled ? 'opacity-40' : 'cursor-pointer'}`}
      >
        <Slider.Track className="relative flex-1 h-2 rounded-full bg-secondary overflow-hidden">
          <Slider.Range className="absolute h-full bg-purple-400" />
          {segmentMarkers?.map((pct) => (
            <div
              key={pct}
              className="absolute top-0 bottom-0 w-px bg-white/60 pointer-events-none"
              style={{ left: `${pct}%` }}
            />
          ))}
        </Slider.Track>
        <Slider.Thumb className="block w-1 h-6 rounded-full bg-white shadow border border-purple-400/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400" />
      </Slider.Root>
    </div>
  );
};

export default SeekBar;
