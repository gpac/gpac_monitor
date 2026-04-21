import { useRef, useCallback, useState } from 'react';

interface SeekBarProps {
  progressPercent: number;
  onSeekPositionChange: (positionPercent: number) => void;
  formatTooltip: (positionPercent: number) => string;
  disabled?: boolean;
  /** Chunk boundary positions as percentages (0–100). First boundary (0%) is omitted. */
  segmentMarkers?: number[];
}

function pointerXToPercent(trackRect: DOMRect, clientX: number): number {
  const ratio = (clientX - trackRect.left) / trackRect.width;
  return Math.max(0, Math.min(100, ratio * 100));
}

const SeekBar = ({
  progressPercent,
  onSeekPositionChange,
  formatTooltip,
  disabled,
  segmentMarkers,
}: SeekBarProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);

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

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!trackRef.current) return;
      setHoverPercent(
        pointerXToPercent(trackRef.current.getBoundingClientRect(), e.clientX),
      );
    },
    [],
  );

  return (
    <div className="relative flex-1">
      {hoverPercent !== null && (
        <div
          className="absolute -top-5 -translate-x-1/2 bg-gray-800 text-gray-200 text-[10px] px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-10"
          style={{ left: `${hoverPercent}%` }}
        >
          {formatTooltip(hoverPercent)}
        </div>
      )}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverPercent(null)}
        className={`relative h-2 w-full rounded-full bg-secondary overflow-hidden ${
          disabled ? 'opacity-40' : 'cursor-pointer'
        }`}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progressPercent)}
      >
        <div
          className="h-full transition-[width] duration-75 bg-purple-400"
          style={{ width: `${progressPercent}%` }}
        />
        {segmentMarkers?.map((pct) => (
          <div
            key={pct}
            className="absolute top-0 bottom-0 w-px bg-white/60 pointer-events-none"
            style={{ left: `${pct}%` }}
          />
        ))}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1 h-6 rounded-full bg-white shadow border border-purple-400/70 transition-[left] duration-75 pointer-events-none"
          style={{ left: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

export default SeekBar;
