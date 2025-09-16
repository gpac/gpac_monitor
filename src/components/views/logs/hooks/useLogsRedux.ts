import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import {
  selectCurrentTool,
  selectGlobalLevel,
  selectVisibleLogs,
} from '@/shared/store/selectors/logsSelectors';
import {
  setTool,
  setGlobalLevel,
  restoreConfig,
} from '@/shared/store/slices/logsSlice';
import { GpacLogLevel, GpacLogTool } from '@/types/domain/gpac/log-types';

const STORAGE_KEY = 'gpac-logs-config';

export function useLogsRedux() {
  const dispatch = useAppDispatch();

  // Redux selectors
  const currentTool = useAppSelector(selectCurrentTool);
  const globalLevel = useAppSelector(selectGlobalLevel);
  const visibleLogs = useAppSelector(selectVisibleLogs);

  // Persistence
  const saveConfig = useCallback(
    (config: { currentTool: GpacLogTool; globalLevel: GpacLogLevel }) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      } catch (error) {
        console.warn('[useLogsRedux] Failed to save config:', error);
      }
    },
    [],
  );

  // Actions with persistence
  const handleSetTool = useCallback(
    (tool: GpacLogTool) => {
      dispatch(setTool(tool));
      saveConfig({ currentTool: tool, globalLevel });
    },
    [dispatch, globalLevel, saveConfig],
  );

  const handleSetGlobalLevel = useCallback(
    (level: GpacLogLevel) => {
      dispatch(setGlobalLevel(level));
      saveConfig({ currentTool, globalLevel: level });
    },
    [dispatch, currentTool, saveConfig],
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
    globalLevel,
    visibleLogs,

    // Actions
    setTool: handleSetTool,
    setGlobalLevel: handleSetGlobalLevel,
  };
}
