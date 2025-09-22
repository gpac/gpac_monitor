import { useEffect, useCallback, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/shared/hooks/redux';
import {
  selectLogsConfigChanges,
  selectIsSubscribed,
  selectLevelsByTool,
  selectDefaultAllLevel,
} from '@/shared/store/selectors/logsSelectors';
import { markConfigAsSent } from '@/shared/store/slices/logsSlice';
import { gpacService } from '@/services/gpacService';
import { 
  GpacLogLevel, 
  GpacLogTool, 
  LogLevelUtils 
} from '@/types/domain/gpac/log-types';


const selectLogsState = (state: any) => state.logs;

/**
 * Parse a log config change string to extract individual changes
 * @param configString - Format: "all@info:core@debug:mmio@warning"
 * @returns Array of parsed config changes
 */
function parseConfigChanges(configString: string): Array<{ tool: GpacLogTool; level: GpacLogLevel }> {
  if (!configString.trim()) return [];
  
  return configString.split(':').map(config => {
    const [tool, level] = config.split('@');
    return { tool: tool as GpacLogTool, level: level as GpacLogLevel };
  });
}

/**
 * Determine if any config change requires a backend call
 * @param changes - Array of config changes
 * @param currentLevelsByTool - Current levels by tool in Redux
 * @param defaultAllLevel - Default level for 'all' tool
 * @param lastSentLevelsByTool - Last sent levels to backend
 * @returns { needsBackend: boolean, backendOnlyChanges: string, reason: string }
 */
function analyzeConfigChanges(
  changes: Array<{ tool: string; level: GpacLogLevel }>,
  defaultAllLevel: GpacLogLevel,
  lastSentLevelsByTool: Record<GpacLogTool, GpacLogLevel>
) {
  const backendRequiredChanges: string[] = [];
  let reason = '';

  for (const change of changes) {
    const { tool, level } = change;
    
    // Get the backend's current level for this tool
    // This is what the backend actually has configured and is collecting
    const backendCurrentLevel = tool === 'all'
      ? defaultAllLevel
      : (lastSentLevelsByTool[tool as GpacLogTool] || defaultAllLevel);
    
    // Check if this change requires a backend call
    // We need backend call if requested level > what backend currently collects
    const needsBackendForThisChange = LogLevelUtils.needsBackendCall(backendCurrentLevel, level);
    
    if (needsBackendForThisChange) {
      backendRequiredChanges.push(`${tool}@${level}`);
      if (!reason) {
        reason = `${tool}@${level} requires more verbosity than backend's current ${tool}@${backendCurrentLevel}`;
      }
    }

    console.log('[useLogsService] Analyzing change:', {
      tool,
      requestedLevel: level,
      backendCurrentLevel,
      needsBackend: needsBackendForThisChange,
      reason: needsBackendForThisChange ? 
        `${level}(${LogLevelUtils.getNumericValue(level)}) > ${backendCurrentLevel}(${LogLevelUtils.getNumericValue(backendCurrentLevel)})` : 
        'Can use frontend filtering'
    });
  }

  return {
    needsBackend: backendRequiredChanges.length > 0,
    backendOnlyChanges: backendRequiredChanges.join(':'),
    reason
  };
}

/**
 * Hook to sync per-tool log configuration with backend
 * Uses intelligent caching to avoid unnecessary backend calls
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
    async (config: string, reason?: string) => {
      try {
        console.log('[useLogsService] Updating backend config:', config, reason ? `(${reason})` : '');

        // Only send if there are actual changes
        if (config.trim() === '') {
          console.log('[useLogsService] No changes to send');
          return;
        }

        // Use the updateLogLevel method with the new config string
        await gpacService.logs.updateLogLevel(config);

        // Mark config as sent to track future changes
        dispatch(markConfigAsSent());
        lastConfigRef.current = configString;
        
        console.log('[useLogsService] Backend config updated successfully');
      } catch (error) {
        console.error(
          '[useLogsService] Failed to update backend config:',
          error,
        );
      }
    },
    [dispatch, configString],
  );

  // Update backend when config changes (with intelligent filtering)
  useEffect(() => {
    console.log('[useLogsService] Effect triggered:', {
      isSubscribed,
      configString,
      lastConfig: lastConfigRef.current,
    });

    // Only update if we're subscribed and config actually changed
    if (!isSubscribed || configString === lastConfigRef.current) {
      console.log('[useLogsService] No update needed:', {
        isSubscribed,
        configChanged: configString !== lastConfigRef.current,
      });
      return;
    }

    // Parse and analyze the config changes
    const changes = parseConfigChanges(configString);
    if (changes.length === 0) {
      console.log('[useLogsService] No valid changes to process');
      return;
    }

    const analysis = analyzeConfigChanges(
      changes, 
      defaultAllLevel,
      logsState.lastSentConfig.levelsByTool
    );

    if (analysis.needsBackend) {
      console.log('[useLogsService] Backend call required:', analysis.reason);
      updateBackendConfig(analysis.backendOnlyChanges, analysis.reason);
    } else {
      console.log('[useLogsService] All changes can be handled by frontend filtering - no backend call needed');
      // Still mark as sent since we don't need to track these frontend-only changes
      dispatch(markConfigAsSent());
      lastConfigRef.current = configString;
    }
  }, [configString, isSubscribed, currentLevelsByTool, defaultAllLevel, logsState.lastSentConfig.levelsByTool, updateBackendConfig, dispatch]);

  return {
    currentConfig: configString,
    updateConfig: updateBackendConfig,
  };
}
