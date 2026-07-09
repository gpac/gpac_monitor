import type { TimelineLaneView } from './timelineViewModel.types';

interface HistoryTimelineLanesProps {
  lanes: TimelineLaneView[];
}

const LANE_LABEL_WIDTH_PX = 56;

const HistoryTimelineLanes = ({ lanes }: HistoryTimelineLanesProps) => (
  <div className="flex flex-col select-none">
    {lanes.map((lane, index) => (
      <div
        key={lane.id}
        className={`relative flex items-center h-5 ${
          index % 2 === 1 ? 'bg-white/[0.02]' : ''
        }`}
      >
        <span
          className="shrink-0 px-2 text-[0.643rem] uppercase tracking-wide text-gray-500 truncate"
          style={{ width: LANE_LABEL_WIDTH_PX }}
        >
          {lane.label}
        </span>
        <div className="relative flex-1 h-full">
          {lane.items.map((item) => (
            <span
              key={
                item.kind === 'event'
                  ? item.event.id
                  : `cluster-${item.fromUs}-${item.toUs}`
              }
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-gray-300/70 ${
                item.kind === 'cluster' ? 'w-2.5 h-2.5' : 'w-1.5 h-1.5'
              }`}
              style={{ left: `${item.positionPercent}%` }}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default HistoryTimelineLanes;
