import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import {
  selectCurrentTool,
  selectLevelsByTool,
  selectDefaultAllLevel,
  selectVisibleToolsFilter,
} from '@/shared/store/selectors/logs/logsSelectors';
import { selectVisibleLogs } from '@/shared/store/selectors/logs/logsFilterSelectors';
import { selectCurrentConfig } from '@/shared/store/selectors/logs/logsPersistenceSelectors';
import { useDisplayQueue } from './useDisplayQueue';
import {
  setTool,
  setToolLevel,
  setDefaultAllLevel,
  toggleToolInVisibleFilter,
  clearVisibleToolsFilter,
  selectAllToolsInFilter,
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
  const visibleToolsFilter = useAppSelector(selectVisibleToolsFilter);
  const rawVisibleLogs = useAppSelector(selectVisibleLogs);
  const currentConfig = useAppSelector(selectCurrentConfig);

  // Throttle visible logs updates using requestAnimationFrame for performance
  const visibleLogs = useDisplayQueue(rawVisibleLogs);

  // Actions with persistence
  const handleSetTool = useCallback(
    (tool: GpacLogTool) => {
      dispatch(setTool(tool));
    },
    [dispatch],
  );

  const handleSetToolLevel = useCallback(
    (tool: GpacLogTool, level: GpacLogLevel) => {
      dispatch(setToolLevel({ tool, level }));
      dispatch(setTool(tool)); // Switch to the tool after changing its level

      // Show toast notification
      toast({
        title: 'Log Level Updated',
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
        title: 'Default Level Updated',
        description: `Default level for all tools set to ${level.toUpperCase()}`,
      });
    },
    [dispatch],
  );

  const handleToggleToolFilter = useCallback(
    (tool: GpacLogTool) => {
      dispatch(toggleToolInVisibleFilter(tool));
    },
    [dispatch],
  );

  const handleClearFilter = useCallback(() => {
    dispatch(clearVisibleToolsFilter());
  }, [dispatch]);

  const handleSelectAllTools = useCallback(
    (tools: GpacLogTool[]) => {
      dispatch(selectAllToolsInFilter(tools));
    },
    [dispatch],
  );

  // Auto-save config when it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentConfig));
  }, [currentConfig]);

  return {
    // State
    currentTool,
    levelsByTool,
    defaultAllLevel,
    visibleToolsFilter,
    visibleLogs,

    // Actions
    setTool: handleSetTool,
    setToolLevel: handleSetToolLevel,
    setDefaultAllLevel: handleSetDefaultAllLevel,
    toggleToolFilter: handleToggleToolFilter,
    clearFilter: handleClearFilter,
    selectAllTools: handleSelectAllTools,
  };
}
