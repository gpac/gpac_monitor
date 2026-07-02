import { memo } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { formatCompactTime } from '@/utils/formatting/time';
import { formatLogTimestampRelative } from '@/components/views/logs/utils/timestampFormatters';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import type {
  TimelineEvent,
  TimelineEventType,
} from '@/services/historyService/types';

const LOG_LINKED_TYPES: ReadonlySet<TimelineEventType> = new Set([
  'error',
  'warning',
]);

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
        <TooltipProvider delayDuration={200}>
          <OverlayScrollbarsComponent
            element="div"
            options={{ scrollbars: { autoHide: 'leave', autoHideDelay: 200 } }}
            className="flex-1 min-h-0"
          >
            {events.map((event) => {
              const { icon, color } = ICON_MAP[event.type];
              const isLogLinked =
                LOG_LINKED_TYPES.has(event.type) &&
                event.loggerTimeUs !== undefined;
              const primaryLabel = isLogLinked
                ? formatLogTimestampRelative(event.loggerTimeUs!)
                : formatCompactTime(event.sessionTimeUs, true);
              const timeButton = (
                <button
                  onClick={() => onSeek(sessionStartUs + event.sessionTimeUs)}
                  className="text-monitor-meta font-mono tabular-nums text-xs shrink-0 hover:brightness-125"
                >
                  {primaryLabel}
                </button>
              );
              return (
                <div
                  key={event.id}
                  className="flex items-center gap-2 px-3 py-0.5 hover:bg-white/5"
                >
                  {isLogLinked ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{timeButton}</TooltipTrigger>
                      <TooltipContent side="top">
                        session {formatCompactTime(event.sessionTimeUs, true)}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    timeButton
                  )}
                  <span className={`${color} text-xs shrink-0`}>{icon}</span>
                  <span className="text-xs text-gray-300 truncate">
                    {event.title}
                  </span>
                </div>
              );
            })}
          </OverlayScrollbarsComponent>
        </TooltipProvider>
      </div>
    );
  },
);

EventJournal.displayName = 'EventJournal';

export default EventJournal;
