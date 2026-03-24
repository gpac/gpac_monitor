import { LuPause, LuPlay } from 'react-icons/lu';
import { Progress } from '@/components/ui/progress';
import { formatCompactTime } from '@/utils/formatting/time';
import type { PlayerState } from '@/services/historyService/replay/eventPlayer';

interface TimelineProps {
  state: PlayerState;
  currentTimeUs: number;
  durationUs: number;
  onPlay: () => void;
  onPause: () => void;
}

const Timeline = ({
  state,
  currentTimeUs,
  durationUs,
  onPlay,
  onPause,
}: TimelineProps) => {
  const isPlaying = state === 'playing';
  const elapsedUs = Math.min(currentTimeUs, durationUs);
  const progressPercent = durationUs > 0 ? (elapsedUs / durationUs) * 100 : 0;

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

      <Progress
        value={progressPercent}
        className="h-1.5 flex-1"
        color="bg-blue-500"
      />

      <span className="text-xs text-gray-400 font-mono tabular-nums whitespace-nowrap">
        {formatCompactTime(elapsedUs)} / {formatCompactTime(durationUs)}
      </span>
    </div>
  );
};

export default Timeline;
