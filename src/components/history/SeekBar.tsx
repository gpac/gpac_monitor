import { useRef, useCallback } from 'react';

interface SeekBarProps {
  progressPercent: number;
  onSeekPositionChange: (positionPercent: number) => void;
  disabled?: boolean;
}

function pointerXToPercent(trackRect: DOMRect, clientX: number): number {
  const ratio = (clientX - trackRect.left) / trackRect.width;
  return Math.max(0, Math.min(100, ratio * 100));
}

const SeekBar = ({
  progressPercent,
  onSeekPositionChange,
  disabled,
}: SeekBarProps) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || !trackRef.current) return;
      e.preventDefault();
      const track = trackRef.current;
      track.setPointerCapture(e.pointerId);

      const rect = track.getBoundingClientRect();
      onSeekPositionChange(pointerXToPercent(rect, e.clientX));

      const onMove = (ev: PointerEvent) => {
        onSeekPositionChange(pointerXToPercent(rect, ev.clientX));
      };
      const onUp = () => {
        track.removeEventListener('pointermove', onMove);
        track.removeEventListener('pointerup', onUp);
      };
      track.addEventListener('pointermove', onMove);
      track.addEventListener('pointerup', onUp);
    },
    [disabled, onSeekPositionChange],
  );

  return (
    <div
      ref={trackRef}
      onPointerDown={handlePointerDown}
      className={`relative h-2 flex-1 rounded-full bg-secondary overflow-hidden ${
        disabled ? 'opacity-40' : 'cursor-pointer'
      }`}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progressPercent)}
    >
      <div
        className="h-full bg-blue-500 transition-[width] duration-75"
        style={{ width: `${progressPercent}%` }}
      />
    </div>
  );
};

export default SeekBar;
