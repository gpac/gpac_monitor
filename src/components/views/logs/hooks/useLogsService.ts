import { useEffect, useCallback, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/shared/hooks/redux';
import {
  selectLogsConfigChanges,
  selectIsSubscribed,
} from '@/shared/store/selectors/logsSelectors';
import { markConfigAsSent } from '@/shared/store/slices/logsSlice';
import { gpacService } from '@/services/gpacService';

/**
 * Hook to sync per-tool log configuration with backend
 * Sends only configuration changes 
 */
export function useLogsService() {
  const dispatch = useAppDispatch();
  const configString = useAppSelector(selectLogsConfigChanges);
  const isSubscribed = useAppSelector(selectIsSubscribed);
  const lastConfigRef = useRef<string>('');

  const updateBackendConfig = useCallback(async (config: string) => {
    try {
      console.log('[useLogsService] Updating backend config:', config);

      // Only send if there are actual changes
      if (config.trim() === '') {
        console.log('[useLogsService] No changes to send');
        return;
      }

      // Use the updateLogLevel method with the new config string
      await gpacService.logs.updateLogLevel(config);

      // Mark config as sent to track future changes
      dispatch(markConfigAsSent());
      lastConfigRef.current = config;
    } catch (error) {
      console.error('[useLogsService] Failed to update backend config:', error);
    }
  }, [dispatch]);

  // Update backend when config changes
  useEffect(() => {
    console.log('[useLogsService] Effect triggered:', {
      isSubscribed,
      configString,
      lastConfig: lastConfigRef.current,
    });

    // Only update if we're subscribed and config actually changed
    if (isSubscribed && configString !== lastConfigRef.current) {
      console.log('[useLogsService] Config changed, updating backend');
      updateBackendConfig(configString);
    } else {
      console.log('[useLogsService] No update needed:', {
        isSubscribed,
        configChanged: configString !== lastConfigRef.current,
      });
    }
  }, [configString, isSubscribed, updateBackendConfig]);

  return {
    currentConfig: configString,
    updateConfig: updateBackendConfig,
  };
}
