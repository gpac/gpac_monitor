import { useMemo, useState } from 'react';
import { Resizable, ResizeCallbackData } from 'react-resizable';
import { useDataSource } from '@/services/dataSource/DataSourceContext';
import { usePlayerState } from '@/services/historyService/usePlayerState';
import { useTimelineEvents } from '@/services/historyService/useTimelineEvents';
import { getDuration } from '@/services/historyService/manifestParser';
import {
  TIMELINE_DOCK_HEIGHT_PX,
  EVENTS_PANEL_WIDTH_PX,
  EVENTS_PANEL_MIN_WIDTH_PX,
  EVENTS_PANEL_MAX_WIDTH_PX,
} from '../historyLayout';
import Timeline from './Timeline';
import TimelineZoomControls from './TimelineZoomControls';
import EventsFilter from './EventsFilter';
import type { TimelineFilter } from './EventsFilter';
import EventJournal from './EventJournal';
import { useTimelineViewport } from '../hooks/useTimelineViewport';
import { getVisibleEvents } from '@/utils/history/timelineViewportView';
import { MIN_VISIBLE_DURATION_US } from '@/utils/history/timelineViewport';
import {
  renderVerticalResizeHandle,
  renderHorizontalResizeHandle,
} from './resizeHandles';

const HistoryControls = () => {
  const { mode, manifest } = useDataSource();
  const { state, currentTimeUs, play, pause, seek } = usePlayerState();
  const [dockHeight, setDockHeight] = useState(TIMELINE_DOCK_HEIGHT_PX);
  const [panelWidth, setPanelWidth] = useState(EVENTS_PANEL_WIDTH_PX);

  const maxDockHeight = useMemo(() => Math.round(window.innerHeight * 0.6), []);
  const durationUs = manifest ? getDuration(manifest) : 0;
  const sessionStartUs = manifest?.startUs ?? 0;
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>('all');
  const allEvents = useTimelineEvents();
  const { viewport, zoomAround } = useTimelineViewport(durationUs);

  const filteredEvents = useMemo(
    () =>
      activeFilter === 'all'
        ? allEvents
        : allEvents.filter((event) => event.type === activeFilter),
    [allEvents, activeFilter],
  );

  const markers = useMemo(
    () =>
      getVisibleEvents(viewport, filteredEvents).map(
        ({ event, positionPercent }) => ({
          id: event.id,
          positionPercent,
          sessionTimeUs: event.sessionTimeUs,
          type: event.type,
        }),
      ),
    [filteredEvents, viewport],
  );

  const playheadSessionUs = currentTimeUs - sessionStartUs;

  if (mode !== 'history') return null;

  return (
    <div className="relative" style={{ height: TIMELINE_DOCK_HEIGHT_PX }}>
      <Resizable
        axis="y"
        width={0}
        height={dockHeight}
        resizeHandles={['n']}
        minConstraints={[0, TIMELINE_DOCK_HEIGHT_PX]}
        maxConstraints={[0, maxDockHeight]}
        handle={renderVerticalResizeHandle}
        onResize={(_event, { size }: ResizeCallbackData) =>
          setDockHeight(size.height)
        }
      >
        <div
          className="z-50 flex flex-row items-stretch border-t border-t-timeline-premium bg-gradient-to-b from-monitor-timeline-premiumFrom to-monitor-timeline-premiumTo"
          style={{
            height: dockHeight,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          <Resizable
            axis="x"
            width={panelWidth}
            height={0}
            resizeHandles={['e']}
            minConstraints={[EVENTS_PANEL_MIN_WIDTH_PX, 0]}
            maxConstraints={[EVENTS_PANEL_MAX_WIDTH_PX, 0]}
            handle={renderHorizontalResizeHandle}
            onResize={(_event, { size }: ResizeCallbackData) =>
              setPanelWidth(size.width)
            }
          >
            <div
              className="shrink-0 flex flex-col border-r border-history-border overflow-hidden"
              style={{ width: panelWidth }}
            >
              <div
                className="shrink-0 flex items-center"
                style={{ height: TIMELINE_DOCK_HEIGHT_PX }}
              >
                <EventsFilter
                  active={activeFilter}
                  onChange={setActiveFilter}
                />
              </div>
              {dockHeight > TIMELINE_DOCK_HEIGHT_PX && (
                <EventJournal
                  events={filteredEvents}
                  sessionStartUs={sessionStartUs}
                  onSeek={seek}
                />
              )}
            </div>
          </Resizable>
          <div className="flex-1 flex items-start px-4 min-w-0">
            <Timeline
              currentTimeUs={currentTimeUs}
              durationUs={durationUs}
              sessionStartUs={sessionStartUs}
              viewport={viewport}
              isPlaying={state === 'playing'}
              onPlay={play}
              onPause={pause}
              onSeek={seek}
              markers={markers}
              endContent={
                <TimelineZoomControls
                  onZoomIn={() => zoomAround(playheadSessionUs, 0.5)}
                  onZoomOut={() => zoomAround(playheadSessionUs, 2)}
                  canZoomIn={
                    viewport.visibleDurationUs > MIN_VISIBLE_DURATION_US
                  }
                  canZoomOut={
                    viewport.visibleDurationUs < viewport.sessionDurationUs
                  }
                />
              }
            />
          </div>
        </div>
      </Resizable>
    </div>
  );
};

export default HistoryControls;
