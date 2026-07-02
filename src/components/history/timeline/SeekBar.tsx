import * as Slider from '@radix-ui/react-slider';
import { useEffect, useState } from 'react';
import type { TimeRuler } from '@/utils/history/generateTimeTicks';

export interface TimelineMarker {
  id: string;
  positionPercent: number;
  sessionTimeUs: number;
  type: 'graph-change' | 'pid-reconfig' | 'args-change' | 'error' | 'warning';
}

const MARKER_COLORS: Record<TimelineMarker['type'], string> = {
  'graph-change': 'bg-purple-400',
  'pid-reconfig': 'bg-cyan-400',
  'args-change': 'bg-yellow-400',
  error: 'bg-red-500',
  warning: 'bg-orange-400',
};

interface SeekBarProps {
  progressPercent: number;
  onSeekPositionChange: (positionPercent: number) => void;
  onMarkerSeek: (sessionTimeUs: number) => void;
  formatTooltip: (positionPercent: number) => string;
  disabled?: boolean;
  timeRuler?: TimeRuler;
  markers?: TimelineMarker[];
}

const SeekBar = ({
  progressPercent,
  onSeekPositionChange,
  onMarkerSeek,
  formatTooltip,
  disabled,
  timeRuler,
  markers,
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
          className="absolute -top-5 -translate-x-1/2 text-gray-200 text-[0.714rem] py-3 rounded pointer-events-none whitespace-nowrap z-10"
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
          <Slider.Range className="absolute h-full bg-history" />
        </Slider.Track>
        <Slider.Thumb className="block w-0.5 h-5 rounded-full bg-white shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-history" />
      </Slider.Root>

      {markers && markers.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {markers.map((marker) => (
            <button
              key={marker.id}
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full pointer-events-auto ${MARKER_COLORS[marker.type]}`}
              style={{ left: `${marker.positionPercent}%` }}
              onClick={() => onMarkerSeek(marker.sessionTimeUs)}
              aria-label={`Seek to ${marker.type}`}
            />
          ))}
        </div>
      )}

      {timeRuler && (
        <div className="relative h-14">
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
              className={`absolute text-[0.643rem] tabular-nums text-gray-300 pointer-events-none select-none ${index === 0 ? '' : '-translate-x-1/2'}`}
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
