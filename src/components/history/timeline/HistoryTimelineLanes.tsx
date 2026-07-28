import type { TimelineLaneView } from './timelineViewModel.types';
import { EVENT_TYPE_COLOR } from './utils/eventTypeColors';
import { LANE_GUTTER_WIDTH_PX } from '../historyLayout';

interface HistoryTimelineLanesProps {
  lanes: TimelineLaneView[];
  playheadPercent: number;
  onSeek: (sessionTimeUs: number) => void;
}

const LANE_HEIGHT_PX = 22;

const laneRowBackground = (index: number) =>
  index % 2 === 1 ? 'bg-white/[0.02]' : '';

const HistoryTimelineLanes = ({
  lanes,
  playheadPercent,
  onSeek,
}: HistoryTimelineLanesProps) => (
  <div className="flex w-full select-none border-t border-white/5">
    <div className="shrink-0" style={{ width: LANE_GUTTER_WIDTH_PX }}>
      {lanes.map((lane, index) => (
        <div
          key={lane.id}
          className={`flex items-center px-2 ${laneRowBackground(index)}`}
          style={{ height: LANE_HEIGHT_PX }}
        >
          <span className="text-[0.643rem] uppercase tracking-wide text-gray-500 truncate">
            {lane.label}
          </span>
        </div>
      ))}
    </div>
    <div className="relative flex-1 min-w-0">
      <div
        className="absolute inset-y-0 w-px -translate-x-1/2 bg-white/30 pointer-events-none z-10"
        style={{ left: `${playheadPercent}%` }}
      />
      {lanes.map((lane, index) => (
        <div
          key={lane.id}
          className={`relative ${laneRowBackground(index)}`}
          style={{ height: LANE_HEIGHT_PX }}
        >
          {lane.items.map((item) => {
            const key =
              item.kind === 'event'
                ? item.event.id
                : `cluster-${item.fromUs}-${item.toUs}`;
            const sessionTimeUs =
              item.kind === 'event' ? item.event.sessionTimeUs : item.fromUs;
            const color =
              item.kind === 'event'
                ? EVENT_TYPE_COLOR[item.event.type]
                : 'bg-gray-300/70';
            return (
              <button
                key={key}
                onClick={() => onSeek(sessionTimeUs)}
                aria-label={`Seek to ${key}`}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full ${color} ${
                  item.kind === 'cluster' ? 'w-2.5 h-2.5' : 'w-2 h-2'
                }`}
                style={{ left: `${item.positionPercent}%` }}
              />
            );
          })}
        </div>
      ))}
    </div>
  </div>
);

export default HistoryTimelineLanes;
