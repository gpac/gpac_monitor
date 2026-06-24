import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { LuPause } from 'react-icons/lu';
import SeekBar from './SeekBar';
import type { TimelineMarker } from './SeekBar';
import { formatCompactTime } from '@/utils/formatting/time';
import { generateTimeTicks } from '@/utils/history/generateTimeTicks';
import { FaCirclePlay } from 'react-icons/fa6';

interface TimelineProps {
  currentTimeUs: number;
  durationUs: number;
  sessionStartUs: number;
  isPlaying?: boolean;
  canPlay?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (targetTimestampUs: number) => void;
  markers?: TimelineMarker[];
  endContent?: ReactNode;
}

const Timeline = ({
  currentTimeUs,
  durationUs,
  sessionStartUs,
  isPlaying = false,
  canPlay = true,
  onPlay,
  onPause,
  onSeek,
  markers,
  endContent,
}: TimelineProps) => {
  const relativeTimeUs = currentTimeUs - sessionStartUs;
  const elapsedUs = Math.max(0, Math.min(relativeTimeUs, durationUs));
  const progressPercent = durationUs > 0 ? (elapsedUs / durationUs) * 100 : 0;
  const timeRuler = useMemo(() => generateTimeTicks(durationUs), [durationUs]);

  const handleSeekPositionChange = useCallback(
    (positionPercent: number) => {
      const targetTimestampUs =
        sessionStartUs + (positionPercent / 100) * durationUs;
      onSeek(targetTimestampUs);
    },
    [sessionStartUs, durationUs, onSeek],
  );

  const formatTooltip = useCallback(
    (positionPercent: number) =>
      formatCompactTime((positionPercent / 100) * durationUs),
    [durationUs],
  );

  return (
    <div className="contents">
      {endContent ?? <div aria-hidden="true" />}

      <div className="flex items-center gap-2 px-2 mx-auto w-full max-w-[900px]">
        <section className="flex items-center gap-2 shrink-0 px-6">
          <span className="shrink-0 text-sm font-mono tabular-nums whitespace-nowrap text-gray-300">
            {formatCompactTime(elapsedUs)} / {formatCompactTime(durationUs)}
          </span>
          <button
            onClick={isPlaying ? onPause : onPlay}
            disabled={!canPlay}
            className="shrink-0 p-1 text-gray-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <LuPause className="w-8 h-8" />
            ) : (
              <FaCirclePlay className="w-8 h-8" />
            )}
          </button>
        </section>
        <SeekBar
          progressPercent={progressPercent}
          onSeekPositionChange={handleSeekPositionChange}
          formatTooltip={formatTooltip}
          disabled={!canPlay}
          timeRuler={timeRuler}
          markers={markers}
        />
      </div>

      <div aria-hidden="true" />
    </div>
  );
};

export default Timeline;
