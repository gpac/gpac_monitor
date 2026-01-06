import { PayloadAction } from '@reduxjs/toolkit';
import { LogsState } from './logs.types';

export const alertsReducers = {
  /** Clear all filter alerts */
  clearAllAlerts: (state: LogsState) => {
    state.alertsByFilterKey = {};
  },

  /** Clear alerts for a specific filter */
  clearFilterAlerts: (state: LogsState, action: PayloadAction<string>) => {
    delete state.alertsByFilterKey[action.payload];
  },
};
