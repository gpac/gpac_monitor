import { memo } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { formatCompactTime } from '@/utils/formatting/time';
import { EVENT_TYPE_COLOR } from './utils/eventTypeColors';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import type { TimelineEvent } from '@/services/historyService/types';

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
              const color = EVENT_TYPE_COLOR[event.type];
              return (
                <div
                  key={event.id}
                  className="flex items-center gap-2 px-3 py-0.5 hover:bg-white/5"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() =>
                          onSeek(sessionStartUs + event.sessionTimeUs)
                        }
                        className="text-monitor-meta font-mono tabular-nums text-xs shrink-0 hover:brightness-125"
                      >
                        {formatCompactTime(event.sessionTimeUs, true)}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      Absolute: {formatCompactTime(event.absoluteTimeUs, true)}
                    </TooltipContent>
                  </Tooltip>
                  <span className={`${color} w-3 h-0.5 rounded-sm shrink-0`} />
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
