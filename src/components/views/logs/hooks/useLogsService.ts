import { useEffect, useCallback, useRef } from 'react';
import { useAppSelector } from '@/shared/hooks/redux';
import { selectLogsConfigChanges, selectIsSubscribed } from '@/shared/store/selectors/logsSelectors';
import { gpacService } from '@/services/gpacService';

/**
 * Hook to sync per-tool log configuration with backend
 * Sends the complete logs config string (e.g., "core@info,demux@warning,all@quiet") to GPAC
 */
export function useLogsService() {
  const configString = useAppSelector(selectLogsConfigChanges);
  const isSubscribed = useAppSelector(selectIsSubscribed);
  const lastConfigRef = useRef<string>('');

  const updateBackendConfig = useCallback(async (config: string) => {
    try {
      console.log('[useLogsService] Updating backend config:', config);

      // Use the updateLogLevel method with the new config string
      await gpacService.logs.updateLogLevel(config);

      lastConfigRef.current = config;
    } catch (error) {
      console.error('[useLogsService] Failed to update backend config:', error);
    }
  }, []);

  // Update backend when config changes
  useEffect(() => {
    console.log('[useLogsService] Effect triggered:', {
      isSubscribed,
      configString,
      lastConfig: lastConfigRef.current
    });

    // Only update if we're subscribed and config actually changed
    if (isSubscribed && configString !== lastConfigRef.current) {
      console.log('[useLogsService] Config changed, updating backend');
      updateBackendConfig(configString);
    } else {
      console.log('[useLogsService] No update needed:', {
        isSubscribed,
        configChanged: configString !== lastConfigRef.current
      });
    }
  }, [configString, isSubscribed, updateBackendConfig]);

  return {
    currentConfig: configString,
    updateConfig: updateBackendConfig,
  };
}