import WidgetWrapper from '../Widget/WidgetWrapper';

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
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="text-red-500 mb-4">Connection error</div>
        <div className="text-gray-400 text-center">{errorMessage}</div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 px-4 rounded-md py-2 bg-red-900 hover:bg-red-800 "
          >
            Retry
          </button>
        )}
      </div>
    </WidgetWrapper>
  );
};

export default ConnectionErrorState;
