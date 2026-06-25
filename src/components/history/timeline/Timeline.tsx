import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { LuPause } from 'react-icons/lu';
import SeekBar from './SeekBar';
import type { TimelineMarker } from './SeekBar';
import SessionTimeIndicator from '@/components/common/SessionTimeIndicator';
import { formatCompactTime } from '@/utils/formatting/time';
import { generateWindowTimeTicks } from '@/utils/history/generateTimeTicks';
import { getCursorPercent } from '@/utils/history/timelineViewportView';
import type { TimelineViewport } from '@/utils/history/timelineViewport';
import { FaCirclePlay } from 'react-icons/fa6';

interface TimelineProps {
  currentTimeUs: number;
  durationUs: number;
  sessionStartUs: number;
  viewport: TimelineViewport;
  isPlaying?: boolean;
  canPlay?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (targetTimestampUs: number) => void;
  markers?: TimelineMarker[];
  startContent?: ReactNode;
  endContent?: ReactNode;
}

const Timeline = ({
  currentTimeUs,
  durationUs,
  sessionStartUs,
  viewport,
  isPlaying = false,
  canPlay = true,
  onPlay,
  onPause,
  onSeek,
  markers,
  startContent,
  endContent,
}: TimelineProps) => {
  const relativeTimeUs = currentTimeUs - sessionStartUs;
  const elapsedUs = Math.max(0, Math.min(relativeTimeUs, durationUs));
  const progressPercent = getCursorPercent(viewport, elapsedUs);
  const timeRuler = useMemo(
    () =>
      generateWindowTimeTicks(
        viewport.visibleStartUs,
        viewport.visibleDurationUs,
      ),
    [viewport],
  );

  const percentToSessionUs = useCallback(
    (positionPercent: number) =>
      viewport.visibleStartUs +
      (positionPercent / 100) * viewport.visibleDurationUs,
    [viewport],
  );

  const handleSeekPositionChange = useCallback(
    (positionPercent: number) => {
      onSeek(sessionStartUs + percentToSessionUs(positionPercent));
    },
    [sessionStartUs, percentToSessionUs, onSeek],
  );

  const formatTooltip = useCallback(
    (positionPercent: number) =>
      formatCompactTime(percentToSessionUs(positionPercent)),
    [percentToSessionUs],
  );

  return (
    <div className="flex items-start gap-2 w-full">
      {startContent && (
        <div className="shrink-0 h-8 flex items-center">{startContent}</div>
      )}
      <section className="flex items-center gap-2 shrink-0 px-6 h-8">
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
      <div className="flex-1 min-w-0">
        <SeekBar
          progressPercent={progressPercent}
          onSeekPositionChange={handleSeekPositionChange}
          formatTooltip={formatTooltip}
          disabled={!canPlay}
          timeRuler={timeRuler}
          markers={markers}
        />
      </div>
      <div className="flex items-center gap-2 shrink-0 min-w-64 justify-end">
        {endContent}
        <SessionTimeIndicator elapsedUs={elapsedUs} durationUs={durationUs} />
      </div>
    </div>
  );
};

export default Timeline;
