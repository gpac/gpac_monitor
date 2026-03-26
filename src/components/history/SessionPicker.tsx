import { useState, useCallback, memo } from 'react';
import {
  LuClapperboard,
  LuRefreshCw,
  LuLoaderCircle,
  LuTriangleAlert,
} from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useDataSource } from '@/services/dataSource/DataSourceContext';
import { useSessionList } from '@/services/historyService/sessionFileReader/useSessionList';
import { useAppSelector } from '@/shared/hooks/redux';
import { selectActiveConnection } from '@/shared/store/selectors';
import { formatBytes, formatTimestamp } from '@/utils/formatting';
import type { SessionInfo } from '@/services/historyService/sessionFileReader/types';

interface SessionRowProps {
  session: SessionInfo;
  onSelect: (sessionId: string) => void;
  disabled: boolean;
}

const SessionRow = memo(({ session, onSelect, disabled }: SessionRowProps) => {
  const isValid = session.hasSnapshot && session.hasEvents;
  return (
    <button
      onClick={() => onSelect(session.sessionId)}
      disabled={disabled || !isValid}
      className="w-full flex items-center justify-between px-4 py-3 rounded-lg
        text-left transition-colors hover:bg-white/5 disabled:opacity-40
        disabled:cursor-not-allowed border border-transparent hover:border-white/10"
    >
      <div>
        <div className="text-sm text-white font-medium">
          {formatTimestamp(session.sessionId)}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {!session.hasSnapshot && (
            <span className="text-red-400">missing snapshot · </span>
          )}
          {!session.hasEvents && (
            <span className="text-red-400">missing events · </span>
          )}
          {!session.isComplete && (
            <span className="text-amber-400">incomplete · </span>
          )}
          {formatBytes(session.sizeBytes)}
        </div>
      </div>
      {session.isComplete ? (
        <LuClapperboard className="w-4 h-4 text-gray-500 shrink-0" />
      ) : (
        <LuTriangleAlert className="w-4 h-4 text-amber-400 shrink-0" />
      )}
    </button>
  );
});

const SessionPicker = () => {
  const { mode, sessionLoaded, loadFromReader } = useDataSource();
  const activeConnection = useAppSelector(selectActiveConnection);
  const { sessions, loading, error, reader, retry } = useSessionList(
    activeConnection?.address,
  );
  const [loadingSession, setLoadingSession] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleSelect = useCallback(
    async (sessionId: string) => {
      if (!reader) return;
      setLoadingSession(true);
      setLoadError(null);
      try {
        await loadFromReader(reader, sessionId);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Load failed');
        setLoadingSession(false);
      }
    },
    [reader, loadFromReader],
  );

  if (mode !== 'history' || sessionLoaded) return null;

  return (
    <div className="fixed inset-0 top-16 z-30 flex items-center justify-center bg-gray-950/80">
      <div className="bg-monitor-surface border border-red-400 rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-monitor-line">
          <LuClapperboard className="w-4 h-4 text-red-400" />
          <span className="text-sm font-semibold text-white">
            Select a session
          </span>
        </div>

        <div className="px-3 py-3 min-h-32">
          {loading && (
            <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
              <Spinner className="w-4 h-4" />
              <span className="text-sm">Loading sessions…</span>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <LuLoaderCircle className="w-6 h-6 text-red-400" />
              <p className="text-sm text-gray-400">{error}</p>
              <Button variant="outline" size="sm" onClick={retry}>
                <LuRefreshCw className="w-3 h-3 mr-1.5" /> Retry
              </Button>
            </div>
          )}

          {!loading && !error && sessions.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <p className="text-sm text-gray-400">No sessions found.</p>
              <Button variant="outline" size="sm" onClick={retry}>
                <LuRefreshCw className="w-3 h-3 mr-1.5" /> Refresh
              </Button>
            </div>
          )}

          {!loading &&
            !error &&
            sessions.map((session) => (
              <SessionRow
                key={session.sessionId}
                session={session}
                onSelect={handleSelect}
                disabled={loadingSession}
              />
            ))}

          {loadError && (
            <p className="text-xs text-red-400 text-center mt-2">{loadError}</p>
          )}

          {loadingSession && (
            <div className="flex items-center justify-center py-2 gap-2 text-gray-400">
              <Spinner className="w-4 h-4" />
              <span className="text-sm">Loading session…</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionPicker;
