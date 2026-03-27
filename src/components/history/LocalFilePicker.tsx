import { useState, useCallback, useRef, useEffect } from 'react';
import { LuFolderOpen } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useDataSource } from '@/services/dataSource/DataSourceContext';
import { LocalFileSessionFileReader } from '@/services/historyService/sessionFileReader';
import { toast } from '@/shared/hooks/useToast';
import SessionRow from './SessionRow';
import type { SessionInfo } from '@/services/historyService/sessionFileReader/types';

const LocalFilePicker = () => {
  const { loadFromReader } = useDataSource();
  const [reader, setReader] = useState<LocalFileSessionFileReader | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loadingSession, setLoadingSession] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.setAttribute('webkitdirectory', '');
    }
  }, []);

  const handleFiles = useCallback(async (files: FileList) => {
    const r = new LocalFileSessionFileReader(Array.from(files));
    setSessions(await r.listSessions());
    setReader(r);
    setLoadError(null);
  }, []);

  const handleSelect = useCallback(
    async (sessionId: string) => {
      if (!reader) return;
      setLoadingSession(true);
      setLoadError(null);
      try {
        await loadFromReader(reader, sessionId);
        if (reader.wasTruncated) {
          toast({
            title: 'Session truncated',
            description: 'Only the first 50,000 events were loaded.',
          });
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Load failed');
        setLoadingSession(false);
      }
    },
    [reader, loadFromReader],
  );

  return (
    <div className="border-t border-monitor-line">
      <div className="px-4 py-3">
        <p className="text-xs text-gray-500 mb-2">Or load from local files</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
          }}
        />
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => inputRef.current?.click()}
        >
          <LuFolderOpen className="w-3.5 h-3.5 mr-1.5" />
          Browse history folder
        </Button>
      </div>

      {sessions.length > 0 && (
        <div className="px-3 pb-3">
          {sessions.map((session) => (
            <SessionRow
              key={session.sessionId}
              session={session}
              onSelect={handleSelect}
              disabled={loadingSession}
            />
          ))}
          {loadingSession && (
            <div className="flex items-center justify-center py-2 gap-2 text-gray-400">
              <Spinner className="w-4 h-4" />
              <span className="text-sm">Loading session…</span>
            </div>
          )}
          {loadError && (
            <p className="text-xs text-red-400 text-center mt-2">{loadError}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default LocalFilePicker;
