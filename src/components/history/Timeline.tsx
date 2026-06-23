import { useCallback } from 'react';
import { LuPause } from 'react-icons/lu';
import SeekBar from './SeekBar';
import { formatCompactTime } from '@/utils/formatting/time';
import { FaCirclePlay } from 'react-icons/fa6';
import type { TimeSegment } from '@/utils/history/mapManifestToSegments';

interface TimelineProps {
  currentTimeUs: number;
  durationUs: number;
  sessionStartUs: number;
  segments: TimeSegment[];
  isPlaying?: boolean;
  canPlay?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (targetTimestampUs: number) => void;
}

const Timeline = ({
  currentTimeUs,
  durationUs,
  sessionStartUs,
  segments,
  isPlaying = false,
  canPlay = true,
  onPlay,
  onPause,
  onSeek,
}: TimelineProps) => {
  const relativeTimeUs = currentTimeUs - sessionStartUs;
  const elapsedUs = Math.max(0, Math.min(relativeTimeUs, durationUs));
  const progressPercent = durationUs > 0 ? (elapsedUs / durationUs) * 100 : 0;
  const segmentMarkers =
    durationUs > 0
      ? segments
          .slice(1)
          .map((seg) => ((seg.fromUs - sessionStartUs) / durationUs) * 100)
      : [];

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
      <div className="flex items-center gap-2">
        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={!canPlay}
          className="p-1 text-gray-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <LuPause className="w-5 h-5" />
          ) : (
            <FaCirclePlay className="w-5 h-5" />
          )}
        </button>
        <span className="text-xs font-mono tabular-nums whitespace-nowrap text-gray-400">
          {formatCompactTime(elapsedUs)} / {formatCompactTime(durationUs)}
        </span>
      </div>

      <div className="flex items-center px-2 rounded-lg border border-timeline-premium bg-monitor-timeline-bg shadow-timeline-premium mx-auto w-full max-w-[900px]">
        <SeekBar
          progressPercent={progressPercent}
          onSeekPositionChange={handleSeekPositionChange}
          formatTooltip={formatTooltip}
          disabled={!canPlay}
          segmentMarkers={segmentMarkers}
        />
      </div>

      <div aria-hidden="true" />
    </div>
  );
};

export default Timeline;
