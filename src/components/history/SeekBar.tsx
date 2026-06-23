import * as Slider from '@radix-ui/react-slider';
import { useEffect, useState } from 'react';
import type { TimeRuler } from '@/utils/history/generateTimeTicks';

interface SeekBarProps {
  progressPercent: number;
  onSeekPositionChange: (positionPercent: number) => void;
  formatTooltip: (positionPercent: number) => string;
  disabled?: boolean;
  timeRuler?: TimeRuler;
}

const SeekBar = ({
  progressPercent,
  onSeekPositionChange,
  formatTooltip,
  disabled,
  timeRuler,
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
    <div className="relative flex-1 bg-white/[0.04] rounded-sm">
      {tooltipPercent !== null && (
        <div
          className="absolute -top-5 -translate-x-1/2 text-gray-200 text-[10px] py-3 rounded pointer-events-none whitespace-nowrap z-10"
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
        className={`relative flex items-center w-full h-8 ${disabled ? 'opacity-40' : 'cursor-pointer'}`}
      >
        <Slider.Track className="relative flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <Slider.Range className="absolute h-full bg-purple-400/70" />
        </Slider.Track>
        <Slider.Thumb className="block w-0.5 h-5 rounded-full bg-white shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400" />
      </Slider.Root>

      {timeRuler && (
        <div className="relative h-3">
          {timeRuler.minor.map((tick) => (
            <div
              key={tick.positionPercent}
              className="absolute bottom-0 w-px h-1.5 bg-white/20 pointer-events-none"
              style={{ left: `${tick.positionPercent}%` }}
            />
          ))}
          {timeRuler.major.map((tick) => (
            <div
              key={tick.positionPercent}
              className="absolute bottom-0 w-px h-3 bg-white/35 pointer-events-none"
              style={{ left: `${tick.positionPercent}%` }}
            />
          ))}
        </div>
      )}

      {timeRuler && timeRuler.major.length > 0 && (
        <div className="relative h-4">
          {timeRuler.major.map((tick, index) => (
            <span
              key={tick.positionPercent}
              className={`absolute text-[9px] tabular-nums text-gray-300 pointer-events-none select-none ${index === 0 ? '' : '-translate-x-1/2'}`}
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
