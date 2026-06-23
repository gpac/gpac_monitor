import { useMemo } from 'react';
import { useDataSource } from '@/services/dataSource/DataSourceContext';
import { usePlayerState } from '@/services/historyService/usePlayerState';
import { mapManifestToSegments } from '@/utils/history/mapManifestToSegments';
import { getDuration } from '@/services/historyService/manifestParser';
import { TIMELINE_DOCK_HEIGHT_PX } from './historyLayout';
import Timeline from './Timeline';

const HistoryControls = () => {
  const { mode, manifest } = useDataSource();
  const { state, currentTimeUs, play, pause, seek } = usePlayerState();

  const segments = useMemo(
    () => (manifest ? mapManifestToSegments(manifest) : []),
    [manifest],
  );
  const durationUs = manifest ? getDuration(manifest) : 0;
  const sessionStartUs = manifest?.startUs ?? 0;

  if (mode !== 'history') return null;

  return (
    <div
      className="grid items-center w-full px-4 border-t border-purple-800/70 bg-monitor-timelineSurface"
      style={{
        height: TIMELINE_DOCK_HEIGHT_PX,
        gridTemplateColumns: '280px minmax(220px, 1fr) 320px',
      }}
    >
      <Timeline
        currentTimeUs={currentTimeUs}
        durationUs={durationUs}
        sessionStartUs={sessionStartUs}
        segments={segments}
        isPlaying={state === 'playing'}
        onPlay={play}
        onPause={pause}
        onSeek={seek}
      />
    </div>
  );
};

export default HistoryControls;
