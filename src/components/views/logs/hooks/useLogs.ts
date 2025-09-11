import { useState, useEffect, useCallback, useDeferredValue, useMemo, useTransition, useRef } from 'react';
import { GpacLogEntry, GpacLogConfig } from '@/types/domain/gpac/log-types';
import { gpacService } from '@/services/gpacService';
import { SubscriptionType } from '@/types/communication/subscription';

interface UseLogsOptions {
  enabled?: boolean;
  logLevel?: GpacLogConfig;
  maxEntries?: number;
}

export function useLogs(options: UseLogsOptions = {}) {
  const {
    enabled = true,
    logLevel = 'all@warning',
    maxEntries = 2000,
  } = options;

  const [logs, setLogs] = useState<GpacLogEntry[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // Buffer pour accumuler les logs pendant le throttling
  const pendingLogsRef = useRef<GpacLogEntry[]>([]);
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour appliquer les logs accumulés avec useTransition
  const flushPendingLogs = useCallback(() => {
    if (pendingLogsRef.current.length === 0) return;
    
    const logsToAdd = [...pendingLogsRef.current];
    pendingLogsRef.current = [];
    
    startTransition(() => {
      setLogs(currentLogs => {
        const newLogs = currentLogs.concat(logsToAdd);
        
        if (newLogs.length <= maxEntries) {
          return newLogs;
        }
        
        // Garde seulement les derniers maxEntries
        return newLogs.slice(-maxEntries);
      });
    });
  }, [maxEntries, startTransition]);

  const handleLogsUpdate = useCallback(
    (newLogs: GpacLogEntry[]) => {
      if (newLogs.length === 0) return;
      
      // Ajouter les nouveaux logs au buffer
      pendingLogsRef.current.push(...newLogs);
      
      // Annuler le timeout précédent s'il existe
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
      
      // Programmer le flush des logs avec throttling
      throttleTimeoutRef.current = setTimeout(() => {
        flushPendingLogs();
        throttleTimeoutRef.current = null;
      }, 50); // 50ms de throttling - plus réactif pour debug
    },
    [flushPendingLogs],
  );

  useEffect(() => {
    if (!enabled) {
      if (logs.length > 0) {
        setLogs([]);
      }
      // Nettoyer les buffers et timeouts
      pendingLogsRef.current = [];
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
        throttleTimeoutRef.current = null;
      }
      setIsSubscribed(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    const setupSubscription = async () => {
      try {
        await gpacService.load();

        if (!isMounted) {
          return;
        }

        const unsubscribeFunc = await gpacService.subscribe(
          {
            type: SubscriptionType.LOGS,
            logLevel,
          },
          (result) => {
            if (result.data && isMounted) {
              handleLogsUpdate(result.data as GpacLogEntry[]);
            }
          },
        );


        if (isMounted) {
          unsubscribe = unsubscribeFunc;
          setIsSubscribed(true);
        } else {
          unsubscribeFunc();
        }
      } catch (error) {
        console.error('[useLogs] Subscription failed:', error);
        if (isMounted) {
          setLogs([]);
          setIsSubscribed(false);
        }
      }
    };

    setupSubscription();

    return () => {
      isMounted = false;
      setIsSubscribed(false);
      // Nettoyer les buffers et timeouts au démontage
      pendingLogsRef.current = [];
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
        throttleTimeoutRef.current = null;
      }
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [enabled, logLevel, handleLogsUpdate]);

  const memoizedLogs = useMemo(() => logs, [logs]);
  const optimizedLogs = useDeferredValue(memoizedLogs);

  return {
    logs: optimizedLogs,
    isSubscribed,
    isPending, // Indique si une transition est en cours
  };
}