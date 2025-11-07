import { useEffect, useCallback, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/shared/hooks/redux';
import {
  selectIsSubscribed,
  selectLevelsByTool,
  selectDefaultAllLevel,
} from '@/shared/store/selectors/logs/logsSelectors';
import { selectLogsConfigChanges } from '@/shared/store/selectors/logs/logsConfigSelectors';
import { markConfigAsSent } from '@/shared/store/slices/logsSlice';
import { gpacService } from '@/services/gpacService';
import { parseConfigChanges } from '../utils/configParser';
import { analyzeConfigChanges } from '../utils/configAnalyzer';

const selectLogsState = (state: any) => state.logs;

/**
 * Hook to sync per-tool log configuration with backend
 * Only calls backend when requested level > current level
 */
export function useLogsService() {
  const dispatch = useAppDispatch();
  const configString = useAppSelector(selectLogsConfigChanges);
  const isSubscribed = useAppSelector(selectIsSubscribed);
  const currentLevelsByTool = useAppSelector(selectLevelsByTool);
  const defaultAllLevel = useAppSelector(selectDefaultAllLevel);
  const logsState = useAppSelector(selectLogsState);
  const lastConfigRef = useRef<string>('');

  const updateBackendConfig = useCallback(
    async (config: string, _reason?: string) => {
      try {
        // Only send if there are actual changes
        if (config.trim() === '') {
          return;
        }

        // Use the updateLogLevel method with the new config string
        await gpacService.logs.updateLogLevel(config);

        // Mark config as sent to track future changes
        dispatch(markConfigAsSent());
        lastConfigRef.current = configString;
      } catch (error) {
        console.error(
          '[useLogsService] Failed to update backend config:',
          error,
        );
      }
    },
    [dispatch, configString],
  );

  // Update backend when config changes
  useEffect(() => {
    // Only update if we're subscribed and config actually changed
    if (!isSubscribed || configString === lastConfigRef.current) {
      return;
    }

    // Parse and analyze the config changes
    const changes = parseConfigChanges(configString);
    if (changes.length === 0) {
      return;
    }

    const analysis = analyzeConfigChanges(
      changes,
      defaultAllLevel,
      logsState.lastSentConfig.levelsByTool,
    );

    if (analysis.needsBackend) {
      updateBackendConfig(analysis.backendOnlyChanges, analysis.reason);
    } else {
      // Don't mark as sent for frontend-only changes to preserve backend state tracking
      lastConfigRef.current = configString;
    }
  }, [
    configString,
    isSubscribed,
    currentLevelsByTool,
    defaultAllLevel,
    logsState.lastSentConfig.levelsByTool,
    updateBackendConfig,
    dispatch,
  ]);

  return {
    currentConfig: configString,
    updateConfig: updateBackendConfig,
  };
}
