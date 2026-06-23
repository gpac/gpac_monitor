import * as Slider from '@radix-ui/react-slider';
import { useEffect, useState } from 'react';
import type { TimeTick } from '@/utils/history/generateTimeTicks';

interface SeekBarProps {
  progressPercent: number;
  onSeekPositionChange: (positionPercent: number) => void;
  formatTooltip: (positionPercent: number) => string;
  disabled?: boolean;
  timeTicks?: TimeTick[];
}

const SeekBar = ({
  progressPercent,
  onSeekPositionChange,
  formatTooltip,
  disabled,
  timeTicks,
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
          className="absolute -top-5 -translate-x-1/2 bg-monitor-surface text-gray-200 text-[10px] py-3 rounded pointer-events-none whitespace-nowrap z-10"
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
        className={`relative flex items-center w-full h-10 ${disabled ? 'opacity-40' : 'cursor-pointer'}`}
      >
        <Slider.Track className="relative flex-1 h-2 rounded-full bg-secondary overflow-hidden">
          <Slider.Range className="absolute h-full bg-purple-400" />
          {timeTicks?.map((tick) => (
            <div
              key={tick.positionPercent}
              className="absolute top-0 bottom-0 w-px bg-white/20 pointer-events-none"
              style={{ left: `${tick.positionPercent}%` }}
            />
          ))}
        </Slider.Track>
        <Slider.Thumb className="block w-1 h-6 rounded-full bg-white shadow border border-purple-400/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400" />
      </Slider.Root>
      {timeTicks && timeTicks.length > 0 && (
        <div className="relative h-4 mt-0.5">
          {timeTicks.map((tick, index) => (
            <span
              key={tick.positionPercent}
              className={`absolute text-[9px] tabular-nums text-gray-500 pointer-events-none select-none ${index === 0 ? '' : '-translate-x-1/2'}`}
              style={{ left: `${tick.positionPercent}%` }}
            >
              {tick.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default SeekBar;
