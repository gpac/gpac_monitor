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


  // Actions with persistence
  const handleSetTool = useCallback(
    (tool: GpacLogTool) => {
      console.log('[useLogsRedux] handleSetTool called:', tool);
      dispatch(setTool(tool));
    },
    [dispatch],
  );

  const handleSetToolLevel = useCallback(
    (tool: GpacLogTool, level: GpacLogLevel) => {
      console.log('[useLogsRedux] handleSetToolLevel called:', tool, level);
      dispatch(setToolLevel({ tool, level }));
      dispatch(setTool(tool)); // Switch to the tool after changing its level
 

      // Show toast notification
      toast({
        title: "Log Level Updated",
        description: `${tool.toUpperCase()} set to ${level.toUpperCase()}`,
      });
    },
    [dispatch],
  );

  const handleSetDefaultAllLevel = useCallback(
    (level: GpacLogLevel) => {
      dispatch(setDefaultAllLevel(level));

      // Show toast notification
      toast({
        title: "Default Level Updated",
        description: `Default level for all tools set to ${level.toUpperCase()}`,
      });
    },
    [dispatch],
  );


  // Auto-save config when it changes
  useEffect(() => {
    console.log('[useLogsRedux] Saving config to localStorage:', currentConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentConfig));
  }, [currentConfig]);

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
  };
}