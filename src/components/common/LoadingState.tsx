import WidgetWrapper from '../Widget/WidgetWrapper';

interface LoadingStateProps {
  id: string;
  message?: string;
}

const LoadingState = ({ id, message }: LoadingStateProps) => {
  return (
    <WidgetWrapper id={id}>
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4" />
        <div className="text-gray-400">{message || 'Chargement...'}</div>
      </div>
    </WidgetWrapper>
  );
};

export default LoadingState;
