import { useMemo, useState } from 'react';
import { Resizable, ResizeCallbackData } from 'react-resizable';
import { useDataSource } from '@/services/dataSource/DataSourceContext';
import { usePlayerState } from '@/services/historyService/usePlayerState';
import { useTimelineEvents } from '@/services/historyService/useTimelineEvents';
import { getDuration } from '@/services/historyService/manifestParser';
import { TIMELINE_DOCK_HEIGHT_PX } from './historyLayout';
import Timeline from './Timeline';
import TimelineZoomControls from './TimelineZoomControls';
import EventsFilter from './EventsFilter';
import type { TimelineFilter } from './EventsFilter';
import { useTimelineViewport } from './hooks/useTimelineViewport';
import { getVisibleEvents } from '@/utils/history/timelineViewportView';
import { MIN_VISIBLE_DURATION_US } from '@/utils/history/timelineViewport';

const renderResizeHandle = (
  _resizeHandleAxis: string,
  ref: React.Ref<HTMLDivElement>,
) => (
  <div
    ref={ref}
    className="absolute -top-1 left-0 right-0 z-30 h-2 cursor-ns-resize hover:bg-purple-500/40"
  />
);

const HistoryControls = () => {
  const { mode, manifest } = useDataSource();
  const { state, currentTimeUs, play, pause, seek } = usePlayerState();
  const [dockHeight, setDockHeight] = useState(TIMELINE_DOCK_HEIGHT_PX);

  const maxDockHeight = useMemo(() => Math.round(window.innerHeight * 0.6), []);
  const durationUs = manifest ? getDuration(manifest) : 0;
  const sessionStartUs = manifest?.startUs ?? 0;
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>('all');
  const allEvents = useTimelineEvents();
  const { viewport, zoomAround } = useTimelineViewport(durationUs);
  const markers = useMemo(() => {
    const filteredEvents =
      activeFilter === 'all'
        ? allEvents
        : allEvents.filter((event) => event.type === activeFilter);
    return getVisibleEvents(viewport, filteredEvents).map(
      ({ event, positionPercent }) => ({
        id: event.id,
        positionPercent,
        type: event.type,
      }),
    );
  }, [allEvents, activeFilter, viewport]);

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
        handle={renderResizeHandle}
        onResize={(_event, { size }: ResizeCallbackData) =>
          setDockHeight(size.height)
        }
      >
        <div
          className="z-20 flex items-center px-4 border-t border-purple-800/70 bg-monitor-timelineSurface"
          style={{
            height: dockHeight,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
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
            startContent={
              <EventsFilter active={activeFilter} onChange={setActiveFilter} />
            }
            endContent={
              <TimelineZoomControls
                onZoomIn={() => zoomAround(playheadSessionUs, 0.5)}
                onZoomOut={() => zoomAround(playheadSessionUs, 2)}
                canZoomIn={viewport.visibleDurationUs > MIN_VISIBLE_DURATION_US}
                canZoomOut={
                  viewport.visibleDurationUs < viewport.sessionDurationUs
                }
              />
            }
          />
        </div>
      </Resizable>
    </div>
  );
};

export default HistoryControls;
