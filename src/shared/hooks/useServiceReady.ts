import { useEffect, useState } from 'react';
import { gpacService } from '@/services/gpacService';
import { useAppSelector } from './redux';
import { selectActiveConnection } from '@/shared/store/selectors';

type UseServiceReadyOptions = { enabled?: boolean; timeoutMs?: number };
type UseServiceReadyResult = {
  isReady: boolean;
  isLoading: boolean;
  error: Error | null;
};

export function useServiceReady({
  enabled = true,
  timeoutMs = 5000,
}: UseServiceReadyOptions = {}): UseServiceReadyResult {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const activeConnection = useAppSelector(selectActiveConnection);

  useEffect(() => {
    if (!enabled || !activeConnection) {
      setIsReady(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Service timeout')), timeoutMs),
    );

    Promise.race([gpacService.ready(activeConnection.address), timeout])
      .then(() => {
        if (!cancelled) {
          setIsReady(true);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error('Service failed'));
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, timeoutMs, activeConnection]);

  return { isReady, isLoading, error };
}
