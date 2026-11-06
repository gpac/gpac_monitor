import { LuRefreshCw, LuLoaderCircle } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface RemoteSessionListStatusProps {
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  onRetry: () => void;
}

const RemoteSessionListStatus = ({
  loading,
  error,
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
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <LuLoaderCircle className="w-6 h-6 text-red-400" />
        <p className="text-sm text-gray-400">{error}</p>
        <p className="text-xs text-gray-500">
          No GPAC connected: drop a history folder above, or start GPAC with{' '}
          <code>-rmt</code> and retry.
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
