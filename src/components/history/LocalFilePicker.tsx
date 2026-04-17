import { useState, useCallback, useRef, useEffect } from 'react';
import { LuFolderOpen } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useDataSource } from '@/services/dataSource/DataSourceContext';
import { LocalFileSessionFileReader } from '@/services/historyService/sessionFileReader';
import { FileHistorySource } from '@/services/historyService/source/FileHistorySource';
import { toast } from '@/shared/hooks/ui/useToast';
import SessionRow from './SessionRow';
import type { SessionInfo } from '@/services/historyService/sessionFileReader/types';

interface LocalFilePickerProps {
  onLocalFilesLoaded?: () => void;
}

const LocalFilePicker = ({ onLocalFilesLoaded }: LocalFilePickerProps) => {
  const { loadFromSource } = useDataSource();
  const [browser, setBrowser] = useState<LocalFileSessionFileReader | null>(
    null,
  );
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loadingSession, setLoadingSession] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.setAttribute('webkitdirectory', '');
    }
  }, []);

  const handleFiles = useCallback(
    async (files: FileList) => {
      const fileBrowser = new LocalFileSessionFileReader(Array.from(files));
      setSessions(await fileBrowser.listSessions());
      setBrowser(fileBrowser);
      setLoadError(null);
      onLocalFilesLoaded?.();
    },
    [onLocalFilesLoaded],
  );

  const loadSession = useCallback(
    async (sessionId: string) => {
      if (!browser) return;
      setLoadingSession(true);
      setLoadError(null);
      try {
        const manifest = await browser.readManifest(sessionId);
        const source = new FileHistorySource(browser, sessionId);
        await loadFromSource(source, undefined, undefined, manifest);
        if (source.wasTruncated) {
          toast({
            title: 'Session truncated',
            description: 'Only the first 50,000 events were loaded.',
          });
        }
      } catch (err) {
        console.error('[LocalFilePicker] load error:', err);
        setLoadError(err instanceof Error ? err.message : 'Load failed');
        setLoadingSession(false);
      }
    },
    [browser, loadFromSource],
  );

  const handleSelect = useCallback(
    (sessionId: string) => loadSession(sessionId),
    [loadSession],
  );

  return (
    <div className=" border-monitor-line">
      <div className="px-4 py-3">
        <p className="text-xs text-gray-500 mb-2">Load from local files</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) handleFiles(event.target.files);
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
          {loadError && <p className="text-xs text-center mt-2">{loadError}</p>}
        </div>
      )}
    </div>
  );
};

export default LocalFilePicker;
