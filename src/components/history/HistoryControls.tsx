import { LuClapperboard } from 'react-icons/lu';
import { useDataSource } from '@/services/dataSource/DataSourceContext';
import { usePlayerState } from '@/services/historyService/usePlayerState';
import Timeline from './Timeline';

/**
 * Bridges usePlayerState + useDataSource → Timeline.
 * Only renders in history mode.
 */
const HistoryControls = () => {
  const { mode } = useDataSource();
  const {
    state,
    currentTimeUs,
    durationUs,
    sessionStartUs,
    play,
    pause,
    seek,
  } = usePlayerState();

  if (mode !== 'history') return null;

  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-lg ring-1 ring-purple-500/70">
      <span className="flex items-center gap-1 text-xs text-purple-400 font-ui whitespace-nowrap">
        <LuClapperboard className="w-3.5 h-3.5" />
        Timeline
      </span>
      <div className="w-px h-4 bg-purple-500/40" />
      <Timeline
        state={state}
        currentTimeUs={currentTimeUs}
        durationUs={durationUs}
        sessionStartUs={sessionStartUs}
        onPlay={play}
        onPause={pause}
        onSeek={seek}
      />
    </div>
  );
};

export default HistoryControls;
