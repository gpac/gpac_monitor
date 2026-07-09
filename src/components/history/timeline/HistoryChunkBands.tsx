import type { PositionedChunkSegment } from './timelineViewModel.types';

interface HistoryChunkBandsProps {
  segments: PositionedChunkSegment[];
}

const LABEL_MIN_WIDTH_PERCENT = 4;
/** Below this width a band adds visual noise (a dense border grid) without conveying information. */
const RENDER_MIN_WIDTH_PERCENT = 0.75;

const HistoryChunkBands = ({ segments }: HistoryChunkBandsProps) => (
  <div className="relative h-4 select-none pointer-events-none">
    {segments
      .filter((segment) => segment.widthPercent >= RENDER_MIN_WIDTH_PERCENT)
      .map((segment) => (
        <div
          key={segment.index}
          className="absolute inset-y-0 bg-white/[0.03] border-l border-white/10 flex items-center overflow-hidden"
          style={{
            left: `${segment.positionPercent}%`,
            width: `${segment.widthPercent}%`,
          }}
        >
          {segment.widthPercent > LABEL_MIN_WIDTH_PERCENT && (
            <span className="px-1 text-[0.571rem] text-gray-500 truncate">
              #{segment.index}
            </span>
          )}
        </div>
      ))}
  </div>
);

export default HistoryChunkBands;
