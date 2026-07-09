import type { TimeRuler } from '@/utils/history/generateTimeTicks';
import type { TimelinePlayhead } from './timelineViewModel.types';

interface HistoryTimeRulerProps {
  rulerTicks: TimeRuler;
  playhead: TimelinePlayhead;
  onSeek?: (positionPercent: number) => void;
}

const HistoryTimeRuler = ({
  rulerTicks,
  playhead,
  onSeek,
}: HistoryTimeRulerProps) => {
  const showPlayhead =
    playhead.positionPercent >= 0 && playhead.positionPercent <= 100;

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const positionPercent = Math.max(
      0,
      Math.min(100, ((event.clientX - rect.left) / rect.width) * 100),
    );
    onSeek(positionPercent);
  };

  return (
    <div
      className={`relative h-9 select-none ${onSeek ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      <div className="relative h-4">
        {rulerTicks.minor.map((tick) => (
          <div
            key={`minor-${tick.positionPercent}`}
            className="absolute bottom-0 w-px h-1.5 bg-white/20 pointer-events-none"
            style={{ left: `${tick.positionPercent}%` }}
          />
        ))}
        {rulerTicks.major.map((tick) => (
          <div
            key={`major-${tick.positionPercent}`}
            className="absolute bottom-0 w-px h-3 bg-white/35 pointer-events-none"
            style={{ left: `${tick.positionPercent}%` }}
          />
        ))}
      </div>
      <div className="relative h-4">
        {rulerTicks.major.map((tick, index) => (
          <span
            key={tick.positionPercent}
            className={`absolute text-[0.643rem] tabular-nums text-gray-400 pointer-events-none select-none ${index === 0 ? '' : '-translate-x-1/2'}`}
            style={{ left: `${tick.positionPercent}%` }}
          >
            {tick.label}
          </span>
        ))}
      </div>
      {showPlayhead && (
        <>
          <div
            className="absolute top-0 bottom-0 w-px bg-history pointer-events-none"
            style={{ left: `${playhead.positionPercent}%` }}
          />
          <div
            className="absolute -top-4 -translate-x-1/2 px-1.5 py-0.5 rounded-sm bg-history text-[0.643rem] text-white whitespace-nowrap pointer-events-none"
            style={{ left: `${playhead.positionPercent}%` }}
          >
            {playhead.label}
          </div>
        </>
      )}
    </div>
  );
};

export default HistoryTimeRuler;
