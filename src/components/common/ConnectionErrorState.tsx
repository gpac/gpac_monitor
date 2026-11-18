import { LuRefreshCw } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import WidgetWrapper from '../widget/WidgetWrapper';

interface ConnectionErrorStateProps {
  id: string;
  errorMessage?: string;
  onRetry?: () => void;
  isLoading?: boolean;
}

const ConnectionErrorState = ({
  id,
  errorMessage,
  onRetry,
  isLoading = false,
}: ConnectionErrorStateProps) => {
  if (isLoading) {
    return (
      <WidgetWrapper id={id}>
        <div
          className="flex items-center justify-center h-full"
          aria-busy="true"
          aria-label="Loading data"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400/60 border-t-transparent" />
        </div>
      </WidgetWrapper>
    );
  }

  return (
    <WidgetWrapper id={id}>
      <div className="flex flex-col items-center justify-center h-full p-4 text-monitor-text-secondary">
        <p className="text-monitor-text-primary">Waiting for GPAC</p>
        <p className="text-sm mt-2 text-center text-monitor-text-muted">
          {errorMessage}
        </p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={onRetry}
          >
            <LuRefreshCw className="w-3 h-3 mr-1.5" /> Retry
          </Button>
        )}
      </div>
    </WidgetWrapper>
  );
};

export default ConnectionErrorState;
