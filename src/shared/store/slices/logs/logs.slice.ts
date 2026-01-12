import { createSlice } from '@reduxjs/toolkit';
import { initialState } from './logs.initialState';
import { configReducers } from './logs.reducers.config';
import { buffersReducers } from './logs.reducers.buffers';
import { uiReducers } from './logs.reducers.ui';
import { alertsReducers } from './logs.reducers.alerts';

// Re-export types for backward compatibility
export type {
  LogViewMode,
  LogsUIFilter,
  FilterAlerts,
  TimestampMode,
} from './logs.types';

const logsSlice = createSlice({
  name: 'logs',
  initialState,
  reducers: {
    ...configReducers,
    ...buffersReducers,
    ...uiReducers,
    ...alertsReducers,
  },
});

export const {
  setTool,
  setToolLevel,
  setDefaultAllLevel,
  toggleToolInVisibleFilter,
  clearVisibleToolsFilter,
  selectAllToolsInFilter,
  appendLogs,
  appendLogsForAllTools,
  setMaxEntriesPerTool,
  setSubscriptionStatus,
  restoreConfig,
  markConfigAsSent,
  setHighlightedLog,
  setUIFilter,
  clearUIFilter,
  toggleTimestampMode,
  clearAllAlerts,
  clearFilterAlerts,
} = logsSlice.actions;

export default logsSlice.reducer;
