import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import {
  selectCurrentTool,
  selectLevelsByTool,
  selectDefaultAllLevel,
  selectVisibleLogs,
  selectCurrentConfig,
} from '@/shared/store/selectors/logsSelectors';
import {
  setTool,
  setToolLevel,
  setDefaultAllLevel,
  restoreConfig,
} from '@/shared/store/slices/logsSlice';
import { GpacLogLevel, GpacLogTool } from '@/types/domain/gpac/log-types';
import { toast } from '@/shared/hooks/useToast';

const STORAGE_KEY = 'gpac-logs-config';

export function useLogsRedux() {
  const dispatch = useAppDispatch();

  // Redux selectors
  const currentTool = useAppSelector(selectCurrentTool);
  const levelsByTool = useAppSelector(selectLevelsByTool);
  const defaultAllLevel = useAppSelector(selectDefaultAllLevel);
  const visibleLogs = useAppSelector(selectVisibleLogs);
  const currentConfig = useAppSelector(selectCurrentConfig);

  // Persistence
  const saveConfig = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentConfig));
    } catch (error) {
      console.warn('[useLogsRedux] Failed to save config:', error);
    }
  }, [currentConfig]);

  // Actions with persistence
  const handleSetTool = useCallback(
    (tool: GpacLogTool) => {
      dispatch(setTool(tool));
      // Auto-save after state update
      setTimeout(saveConfig, 0);
    },
    [dispatch, saveConfig],
  );

  const handleSetToolLevel = useCallback(
    (tool: GpacLogTool, level: GpacLogLevel) => {
      console.log('[useLogsRedux] handleSetToolLevel called:', tool, level);
      dispatch(setToolLevel({ tool, level }));
      // Auto-save after state update
      setTimeout(saveConfig, 0);

      // Show toast notification
      toast({
        title: "Log Level Updated",
        description: `${tool.toUpperCase()} set to ${level.toUpperCase()}`,
      });
    },
    [dispatch, saveConfig],
  );

  const handleSetDefaultAllLevel = useCallback(
    (level: GpacLogLevel) => {
      dispatch(setDefaultAllLevel(level));
      // Auto-save after state update
      setTimeout(saveConfig, 0);

      // Show toast notification
      toast({
        title: "Default Level Updated",
        description: `Default level for all tools set to ${level.toUpperCase()}`,
      });
    },
    [dispatch, saveConfig],
  );

  // Restore on mount with migration logic
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const config = JSON.parse(saved);

        // Migration: convert old globalLevel format to new per-tool format
        if (config.globalLevel && !config.levelsByTool) {
          console.log('[useLogsRedux] Migrating from old globalLevel format');

          const migratedConfig = {
            currentTool: config.currentTool,
            // Keep levelsByTool empty - only store user changes
            levelsByTool: {} as Record<GpacLogTool, GpacLogLevel>,
            // Use old globalLevel as defaultAllLevel, or QUIET as fallback
            defaultAllLevel: config.globalLevel || GpacLogLevel.QUIET,
          };

          dispatch(restoreConfig(migratedConfig));

          // Save migrated config immediately
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedConfig));
          console.log('[useLogsRedux] Migration completed:', migratedConfig);
        } else {
          // Normal restoration
          dispatch(restoreConfig(config));
        }
      }
    } catch (error) {
      console.warn('[useLogsRedux] Failed to restore config:', error);
    }
  }, [dispatch]);

  return {
    // State
    currentTool,
    levelsByTool,
    defaultAllLevel,
    visibleLogs,

    // Actions
    setTool: handleSetTool,
    setToolLevel: handleSetToolLevel,
    setDefaultAllLevel: handleSetDefaultAllLevel,

    // @deprecated - For backward compatibility
    globalLevel: defaultAllLevel,
    setGlobalLevel: handleSetDefaultAllLevel,
  };
}
