import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useGpacService } from './useGpacService';
import { useServiceReady } from './useServiceReady';
import { selectCommandLine } from '@/shared/store/selectors/sessionDetails/sessionDetailsSelectors';

/**
 * Hook to retrieve the GPAC command line.
 * Reads from Redux first (populated by live dispatch or snapshot hydration).
 * Triggers a WebSocket fetch only when the value is not yet in the store.
 */
export const useCommandLine = () => {
  const commandLine = useSelector(selectCommandLine);
  const gpacService = useGpacService();
  const { isReady } = useServiceReady();

  useEffect(() => {
    if (commandLine !== null) return; // already hydrated (history or already fetched)
    if (!isReady) return;
    gpacService.getCommandLine().catch(() => {});
  }, [isReady, commandLine, gpacService]);

  return { commandLine, isLoading: commandLine === null && isReady };
};
