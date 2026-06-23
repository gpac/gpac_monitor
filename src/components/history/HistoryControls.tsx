import { useMemo, useState } from 'react';
import { Resizable, ResizeCallbackData } from 'react-resizable';
import { useDataSource } from '@/services/dataSource/DataSourceContext';
import { usePlayerState } from '@/services/historyService/usePlayerState';
import { getDuration } from '@/services/historyService/manifestParser';
import { TIMELINE_DOCK_HEIGHT_PX } from './historyLayout';
import Timeline from './Timeline';

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
          className="absolute bottom-0 left-0 right-0 z-20 grid items-center px-4 border-t border-purple-800/70 bg-monitor-timelineSurface"
          style={{
            height: dockHeight,
            gridTemplateColumns: '280px minmax(220px, 1fr) 320px',
          }}
        >
          <Timeline
            currentTimeUs={currentTimeUs}
            durationUs={durationUs}
            sessionStartUs={sessionStartUs}
            isPlaying={state === 'playing'}
            onPlay={play}
            onPause={pause}
            onSeek={seek}
          />
        </div>
      </Resizable>
    </div>
  );
};

export default HistoryControls;
