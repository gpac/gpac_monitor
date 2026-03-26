import { useCallback } from 'react';
import { LuPause, LuPlay } from 'react-icons/lu';
import SeekBar from './SeekBar';
import { formatCompactTime } from '@/utils/formatting/time';
import type { PlayerState } from '@/services/historyService/replay/eventPlayer';

interface TimelineProps {
  state: PlayerState;
  currentTimeUs: number;
  durationUs: number;
  sessionStartUs: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (targetTimestampUs: number) => void;
}

const Timeline = ({
  state,
  currentTimeUs,
  durationUs,
  sessionStartUs,
  onPlay,
  onPause,
  onSeek,
}: TimelineProps) => {
  const isPlaying = state === 'playing';
  const elapsedUs = Math.min(currentTimeUs, durationUs);
  const progressPercent = durationUs > 0 ? (elapsedUs / durationUs) * 100 : 0;

  const handleSeekPositionChange = useCallback(
    (positionPercent: number) => {
      const targetTimestampUs =
        sessionStartUs + (positionPercent / 100) * durationUs;
      onSeek(targetTimestampUs);
    },
    [sessionStartUs, durationUs, onSeek],
  );

  return (
    <div className="flex items-center gap-3 min-w-64">
      <button
        onClick={isPlaying ? onPause : onPlay}
        disabled={durationUs === 0}
        className="p-1 text-gray-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <LuPause className="w-4 h-4" />
        ) : (
          <LuPlay className="w-4 h-4" />
        )}
      </button>

      <SeekBar
        progressPercent={progressPercent}
        onSeekPositionChange={handleSeekPositionChange}
        disabled={durationUs === 0}
      />

      <span className="text-xs text-gray-400 font-mono tabular-nums whitespace-nowrap">
        {formatCompactTime(elapsedUs)} / {formatCompactTime(durationUs)}
      </span>
    </div>
  );
};

export default Timeline;
