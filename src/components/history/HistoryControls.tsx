import { useMemo } from 'react';
import { LuClapperboard } from 'react-icons/lu';
import { useDataSource } from '@/services/dataSource/DataSourceContext';
import { usePlayerState } from '@/services/historyService/usePlayerState';
import { mapManifestToSegments } from '@/utils/history/mapManifestToSegments';
import { getDuration } from '@/services/historyService/manifestParser';
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
    <div className="flex items-center gap-2  px-2 py-3 rounded-lg ring-1 ring-purple-500/70">
      <span className="flex items-center gap-1 text-xs text-purple-400 font-ui whitespace-nowrap">
        <LuClapperboard className="w-3.5 h-3.5" />
        Timeline
      </span>
      <div className="w-px h-4 bg-purple-500/40" />
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
