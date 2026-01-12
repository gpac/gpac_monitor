import { PayloadAction } from '@reduxjs/toolkit';
import { LogId } from '@/components/views/logs/utils/logIdentifier';
import { LogsState, LogsUIFilter } from './logs.types';

export const uiReducers = {
  /** Track WebSocket logs subscription status */
  setSubscriptionStatus: (state: LogsState, action: PayloadAction<boolean>) => {
    state.isSubscribed = action.payload;
  },

  /** Set the currently highlighted log (for visual tracking across filters) */
  setHighlightedLog: (
    state: LogsState,
    action: PayloadAction<LogId | null>,
  ) => {
    state.highlightedLogId = action.payload;
  },

  /** Set UI-only filter for log levels and filter keys (doesn't affect backend config) */
  setUIFilter: (state: LogsState, action: PayloadAction<LogsUIFilter>) => {
    state.uiFilter = action.payload;
    state.viewMode = 'globalFilter'; // Switch to global filter mode
  },

  /** Clear UI-only filter (show all logs according to config) */
  clearUIFilter: (state: LogsState) => {
    state.uiFilter = null;
    state.viewMode = 'perTool'; // Return to per-tool mode
  },

  /** Toggle timestamp mode between relative (sys.clock_us) and absolute (Date.now) */
  toggleTimestampMode: (state: LogsState) => {
    state.timestampMode =
      state.timestampMode === 'relative' ? 'absolute' : 'relative';
  },
};
