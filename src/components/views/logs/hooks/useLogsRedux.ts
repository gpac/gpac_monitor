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
      dispatch(setToolLevel({ tool, level }));
      // Auto-save after state update
      setTimeout(saveConfig, 0);
    },
    [dispatch, saveConfig],
  );

  const handleSetDefaultAllLevel = useCallback(
    (level: GpacLogLevel) => {
      dispatch(setDefaultAllLevel(level));
      // Auto-save after state update
      setTimeout(saveConfig, 0);
    },
    [dispatch, saveConfig],
  );

  // Restore on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const config = JSON.parse(saved);
        dispatch(restoreConfig(config));
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
