import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useGpacService } from '../connection/useGpacService';
import { useServiceReady } from '../connection/useServiceReady';
import { selectCommandLine } from '@/shared/store/selectors/sessionDetails/sessionDetailsSelectors';


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
