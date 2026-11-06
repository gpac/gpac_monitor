import { LuRefreshCw, LuCircleX } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { SessionListFailure } from '@/utils/history/sessionListFailure';

interface RemoteSessionListStatusProps {
  loading: boolean;
  failure: SessionListFailure | null;
  isEmpty: boolean;
  onRetry: () => void;
}

const RemoteSessionListStatus = ({
  loading,
  failure,
  isEmpty,
  onRetry,
}: RemoteSessionListStatusProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
        <Spinner className="w-4 h-4" />
        <span className="text-sm">Loading sessions…</span>
      </div>
    );
  }
  if (failure === 'no-gpac') {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <p className="text-sm text-gray-400">No GPAC connected</p>
        <p className="text-xs text-gray-500">
          To see recordings here, start GPAC with:
        </p>
        <code className="rounded bg-gray-900 px-2 py-1 font-mono text-xs text-gray-300">
          {'-rmt -rmt-log=<folder>'}
        </code>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <LuRefreshCw className="w-3 h-3 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }
  if (failure === 'list-failed') {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <LuCircleX className="w-6 h-6 text-red-400" />
        <p className="text-sm text-gray-400">Couldn't load sessions</p>
        <p className="text-xs text-gray-500">
          GPAC is connected, but its session list could not be loaded. Try
          again.
        </p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <LuRefreshCw className="w-3 h-3 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }
  if (!isEmpty) return null;
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <p className="text-sm text-gray-400">
        The connected GPAC is not recording. Start it with{' '}
        <code>{'-rmt-log=<folder>'}</code> to list its sessions here, or drop a
        history folder above.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <LuRefreshCw className="w-3 h-3 mr-1.5" /> Refresh
      </Button>
    </div>
  );
};

export default RemoteSessionListStatus;
