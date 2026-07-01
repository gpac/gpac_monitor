import { memo } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { formatCompactTime } from '@/utils/formatting/time';
import type {
  TimelineEvent,
  TimelineEventType,
} from '@/services/historyService/types';

const ICON_MAP: Record<TimelineEventType, { icon: string; color: string }> = {
  error: { icon: '▲', color: 'text-red-500' },
  warning: { icon: '▲', color: 'text-yellow-400' },
  'graph-change': { icon: '◆', color: 'text-purple-400' },
  'pid-reconfig': { icon: '⚑', color: 'text-cyan-400' },
  'args-change': { icon: '∥', color: 'text-yellow-400' },
};

interface EventJournalProps {
  events: TimelineEvent[];
  sessionStartUs: number;
  onSeek: (absoluteUs: number) => void;
}

const EventJournal = memo(
  ({ events, sessionStartUs, onSeek }: EventJournalProps) => {
    if (events.length === 0) return null;

    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="px-3 py-1 text-xs font-medium text-gray-400 shrink-0">
          Event Journal
        </div>
        <OverlayScrollbarsComponent
          element="div"
          options={{ scrollbars: { autoHide: 'leave', autoHideDelay: 200 } }}
          className="flex-1 min-h-0"
        >
          {events.map((event) => {
            const { icon, color } = ICON_MAP[event.type];
            return (
              <div
                key={event.id}
                className="flex items-center gap-2 px-3 py-0.5 hover:bg-white/5"
              >
                <button
                  onClick={() => onSeek(sessionStartUs + event.sessionTimeUs)}
                  className="text-monitor-meta font-mono tabular-nums text-xs shrink-0 hover:brightness-125"
                >
                  {formatCompactTime(event.sessionTimeUs, true)}
                </button>
                <span className={`${color} text-xs shrink-0`}>{icon}</span>
                <span className="text-xs text-gray-300 truncate">
                  {event.title}
                </span>
              </div>
            );
          })}
        </OverlayScrollbarsComponent>
      </div>
    );
  },
);

EventJournal.displayName = 'EventJournal';

export default EventJournal;
