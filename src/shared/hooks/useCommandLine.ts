import { useState, useEffect } from 'react';
import { useGpacService } from './useGpacService';

/**
 * Hook to retrieve the GPAC command line (fetched once per session)
 */
export const useCommandLine = () => {
  const gpacService = useGpacService();
  const [commandLine, setCommandLine] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchCommandLine = async () => {
      try {
        const result = await gpacService.getCommandLine();
        if (isMounted) {
          setCommandLine(result);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[useCommandLine] Error fetching command line:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCommandLine();

    return () => {
      isMounted = false;
    };
  }, [gpacService]);

  return { commandLine, isLoading };
};
